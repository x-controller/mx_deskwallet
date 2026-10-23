# MX DeskWallet

基于 Tauri 2 + Vue 3 的极简 EVM 桌面钱包：私钥导入、创建钱包、钱包分组、配置 RPC、一键清空（先 Token 后原生币，支持勾选）。

## 目录

- `frontend/web/` 前端（Vite + Vue 3 + Pinia，Mx 前缀自研组件，`src/assets/styles/tokens.css` 为全站 design tokens）
- `src-tauri/` Tauri 壳（store / http / clipboard 三个插件，无自定义命令）
- `todo/` 按版本维护的待办清单

## 开发

```bash
pnpm install && pnpm --dir frontend/web install
pnpm tauri dev      # 桌面调试（自动起 Vite）
pnpm dev            # 仅浏览器调试（金库退化为 localStorage，RPC 走浏览器 fetch）
pnpm tauri build    # 产出 NSIS 安装包：src-tauri/target/release/bundle/nsis/
```

## 数据与安全

- 所有钱包 / 分组 / 网络配置用口令 PBKDF2 派生的 AES-GCM 密钥整体加密，落在应用数据目录的 `vault.json`
- 忘记口令只能在解锁页重置金库（数据清空），请及时在「编辑钱包」里备份私钥
- 一键清空会把勾选资产全部转到目标地址，原生币自动扣除 gas，操作不可撤销
