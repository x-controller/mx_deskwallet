//! 检查、下载、安装新版本。发布地址和验签公钥在 tauri.conf.json 的 plugins.updater 里

use serde::Serialize;
use std::sync::Mutex;
use tauri::{AppHandle, Emitter, State};
use tauri_plugin_updater::{Update, UpdaterExt};

/// 下载好等待安装的更新：安装会退出应用，要等正在发送的交易结束再装，所以和下载分成两步
#[derive(Default)]
pub struct PendingUpdate(Mutex<Option<(Update, Vec<u8>)>>);

#[derive(Serialize)]
pub struct UpdateInfo {
    version: String,
    notes: String,
}

/// 系统代理：先看 HTTPS_PROXY / ALL_PROXY 环境变量，再看 Windows「Internet 选项」里启用的代理（v2rayN / Clash 设的系统代理）。
/// 不开 reqwest 的 system-proxy 特性：特性是全局的，RPC 请求的走向会跟着变
fn system_proxy() -> Option<String> {
    ["HTTPS_PROXY", "https_proxy", "ALL_PROXY", "all_proxy"]
        .iter()
        .find_map(|k| std::env::var(k).ok().filter(|v| !v.trim().is_empty()))
        .or_else(registry_proxy)
}

#[cfg(windows)]
fn registry_proxy() -> Option<String> {
    use winreg::{enums::HKEY_CURRENT_USER, RegKey};
    let key = RegKey::predef(HKEY_CURRENT_USER).open_subkey(r"Software\Microsoft\Windows\CurrentVersion\Internet Settings").ok()?;
    if key.get_value::<u32, _>("ProxyEnable").ok()? == 0 {
        return None;
    }
    parse_proxy_server(&key.get_value::<String, _>("ProxyServer").ok()?)
}

#[cfg(not(windows))]
fn registry_proxy() -> Option<String> {
    None
}

/// ProxyServer 有两种写法：`host:port`，或按协议分开的 `http=host:port;https=host:port`
#[cfg(windows)]
fn parse_proxy_server(s: &str) -> Option<String> {
    let s = s.trim();
    if s.is_empty() {
        return None;
    }
    if s.contains("://") {
        return Some(s.to_string());
    }
    if !s.contains('=') {
        return Some(format!("http://{s}"));
    }
    let entries: Vec<(&str, &str)> = s.split(';').filter_map(|e| e.split_once('=')).map(|(k, v)| (k.trim(), v.trim())).collect();
    ["https", "http"].iter().find_map(|want| {
        entries.iter().find(|(k, _)| k.eq_ignore_ascii_case(want)).map(|(_, v)| format!("http://{v}"))
    })
}

/// 走系统代理，没有新版本时返回 None
async fn find(app: &AppHandle) -> Result<Option<Update>, String> {
    let mut builder = app.updater_builder();
    if let Some(p) = system_proxy() {
        let url = p.parse().map_err(|e| format!("系统代理地址不对 {p}：{e}"))?;
        builder = builder.proxy(url);
    }
    let updater = builder.build().map_err(|e| e.to_string())?;
    updater.check().await.map_err(|e| format!("检查更新失败：{e}"))
}

#[tauri::command]
pub async fn update_check(app: AppHandle) -> Result<Option<UpdateInfo>, String> {
    let update = find(&app).await?;
    Ok(update.map(|u| UpdateInfo { version: u.version, notes: u.body.unwrap_or_default() }))
}

/// 下载并验签，签名不对时这里就会失败。百分比变化时发 update-progress，服务器没给总大小就不发
#[tauri::command]
pub async fn update_download(app: AppHandle, pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let update = find(&app).await?.ok_or("已经是最新版本")?;
    let mut received = 0u64;
    let mut last_percent = None;
    let on_chunk = |chunk: usize, total: Option<u64>| {
        received += chunk as u64;
        let Some(total) = total.filter(|t| *t > 0) else { return };
        let percent = (received * 100 / total).min(100);
        if last_percent != Some(percent) {
            last_percent = Some(percent);
            let _ = app.emit("update-progress", percent);
        }
    };
    let bytes = update.download(on_chunk, || {}).await.map_err(|e| format!("下载更新失败：{e}"))?;
    *pending.0.lock().unwrap() = Some((update, bytes));
    Ok(())
}

/// 启动安装程序并退出应用，安装完会自动重新打开
#[tauri::command]
pub fn update_install(pending: State<'_, PendingUpdate>) -> Result<(), String> {
    let (update, bytes) = pending.0.lock().unwrap().take().ok_or("还没有下载更新")?;
    update.install(bytes).map_err(|e| format!("安装更新失败：{e}"))
}
