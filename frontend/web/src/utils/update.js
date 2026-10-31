/**
 * 新版本检查与安装：走 src-tauri/src/update.rs。
 * 浏览器调试时没有更新。
 */
import { isTauri } from './storage'

async function invoke(cmd) {
  const { invoke } = await import('@tauri-apps/api/core')
  return invoke(cmd)
}

/** 当前版本号，浏览器调试时为空 */
export async function appVersion() {
  if (!isTauri) return ''
  const { getVersion } = await import('@tauri-apps/api/app')
  return getVersion()
}

/** 有新版本返回 { version, notes }，已是最新返回 null */
export const updateCheck = () => (isTauri ? invoke('update_check') : Promise.resolve(null))

export const updateDownload = () => invoke('update_download')

/** 启动安装程序并退出应用，安装完自动重新打开 */
export const updateInstall = () => invoke('update_install')

/** 监听下载百分比（0-100），返回取消监听的函数 */
export async function onUpdateProgress(handler) {
  if (!isTauri) return () => {}
  const { listen } = await import('@tauri-apps/api/event')
  return listen('update-progress', (e) => handler(e.payload))
}
