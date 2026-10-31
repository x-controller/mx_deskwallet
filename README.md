# Portunus

> 名字取自罗马神话的钥匙之神波尔图努斯（Portunus）：手持钥匙，掌管门与港口，对应「私钥握在自己手里，资金进出都由自己开门」。

基于 Tauri 2 + Vue 3 的极简 EVM 桌面钱包：私钥导入、创建钱包、观察钱包（只存地址看余额）、钱包分组、配置 RPC、原生币 / Token 转账、DEX 兑换（Uniswap V2 / V3、PancakeSwap V2 / V3、QuickSwap 等，V3 自动择优手续费档位，可自行添加同类路由）、交易记录（搜索 / 分页 / 状态轮询）、一键清空（先 Token 后原生币，支持勾选）、dApp 连接（WalletConnect v2，任何支持 WalletConnect 的网页 dApp 都能连本钱包签名）。

## 目录

- `frontend/web/` 前端（Vite + Vue 3 + Pinia，Mx 前缀自研组件，`src/assets/styles/tokens.css` 为全站 design tokens）
- `src-tauri/` Tauri 壳（store / http / clipboard / updater 四个插件，自定义命令只有更新，src/update.rs）
- `todo/` 按版本维护的待办清单

## 开发

```bash
pnpm install && pnpm --dir frontend/web install
pnpm tauri dev      # 桌面调试（自动起 Vite）
pnpm dev            # 仅浏览器调试（金库退化为 localStorage，RPC 走浏览器 fetch）
pnpm tauri build    # 产出 NSIS 安装包：src-tauri/target/release/bundle/nsis/
```

## 数据与安全

- 所有钱包 / 分组 / 网络配置 / 交易记录用口令 PBKDF2 派生的 AES-GCM 密钥整体加密，落在应用数据目录的 `vault.json`
- 忘记口令只能在解锁页重置金库（数据清空），请及时在「编辑钱包」里备份私钥
- 观察钱包只保存地址，不含私钥：能查余额、作收款方，不能转账 / 兑换 / 清空 / 给 dApp 签名；之后导入该地址的私钥会自动升级为普通钱包
- 兑换走网络配置里的 Router：V2 直接查 `getAmountsOut`，V3 经 QuoterV2 遍历手续费档位；报价取直连 / 经包装币中转所有路线里输出最多的，显示价格影响并按滑点设最少到手；Token 授权不足时先发 approve（默认只授权本次数量）
- 转账、兑换与一键清空都需二次确认且不可撤销；广播后的交易进入「交易记录」，待确认记录每 10 秒轮询回执，可识别成功 / 回滚 / 被替换丢弃

## dApp 连接（WalletConnect）

- 应用内置了 Reown Cloud Project ID（构建时的 `VITE_WC_PROJECT_ID`），可在顶栏「dApp 连接」弹框里更换，保存在本机金库
- 在 dApp 里选择 WalletConnect，复制 `wc:` 连接串粘贴进来，钱包会弹出连接请求：选择暴露的钱包与网络（dApp 要求的链必须已在「配置 RPC」里）
- 之后 dApp 的每个请求都需要逐条批准：交易会解码 ERC-20 transfer / approve 并估算手续费，无限授权、未知合约、钓鱼域名、eth_sign 都会标红提示；签名支持 personal_sign 与 EIP-712
- dApp 发出的交易写入交易记录（类型 dApp），锁定钱包后请求会排队，解锁后继续处理
- 会话由 SDK 保存在本机浏览器存储里，不含私钥；消息经 WalletConnect 中继端到端加密转发

## 发布与更新

- 用户下载和应用更新都走本仓库的 GitHub Releases，那里放功能说明、安装包和 `latest.json`
- 发布：升 `src-tauri/tauri.conf.json` 的版本号、提交后在干净的工作区运行 `node scripts/release.mjs <公开说明.md> "<一句话更新摘要>"`，会打包签名、确认 exe 不含本机路径、打 tag 推到 `github` 远端，再创建 Release
- 打包需要更新签名私钥 `~/.tauri/portunus-updater.key`（`createUpdaterArtifacts` 开着，没有私钥时 `pnpm tauri build` 会在最后一步失败）。**私钥丢失后已安装的版本就收不到更新**；钱包的更新包能接触到用户私钥，**私钥泄露的后果同样严重**。请单独离线备份，不要提交进仓库
- 解锁后检查一次，之后每 6 小时检查一次，有新版本时状态栏提示，点击确认后下载、验签、安装并自动重开，过程中状态栏显示进度；点状态栏的版本号可手动检查。更新请求走系统代理
- 安装会直接退出进程，所以下载完要等转账、清空、兑换和 dApp 请求都发送结束才安装
