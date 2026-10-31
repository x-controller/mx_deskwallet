// 发布新版本：node scripts/release.mjs <公开说明.md> "<一句话更新摘要>"
// 打包并签名 → 确认 exe 不含本机路径 → 打 tag 推到 GitHub → 把安装包和 latest.json 发到 Releases。
// 摘要会显示在应用的更新确认框里。
import { execFileSync } from 'node:child_process'
import { mkdtempSync, readFileSync, writeFileSync } from 'node:fs'
import { homedir, tmpdir } from 'node:os'
import { basename, join, resolve } from 'node:path'

const PUBLIC_REPO = 'x-controller/Portunus'
const REMOTE = 'github'
const KEY_PATH = join(homedir(), '.tauri', 'portunus-updater.key')

const root = resolve(import.meta.dirname, '..')
const run = (cmd, args, env) => execFileSync(cmd, args, { cwd: root, stdio: 'inherit', shell: cmd === 'pnpm', env: { ...process.env, ...env } })
const read = (cmd, args) => execFileSync(cmd, args, { cwd: root, encoding: 'utf8' }).trim()

const [notesFile, summary] = process.argv.slice(2)
if (!notesFile || !summary) throw new Error('用法：node scripts/release.mjs <公开说明.md> "<一句话更新摘要>"')
if (read('git', ['status', '--porcelain'])) throw new Error('工作区有未提交的改动')

const { version } = JSON.parse(readFileSync(join(root, 'src-tauri/tauri.conf.json'), 'utf8'))
const tag = `v${version}`

// 把依赖和项目的绝对路径从 exe 里去掉，否则 panic 信息会带上本机用户名
const remap = [join(homedir(), '.cargo'), join(homedir(), '.rustup'), root, homedir()]
run('pnpm', ['tauri', 'build'], {
  TAURI_SIGNING_PRIVATE_KEY: readFileSync(KEY_PATH, 'utf8'),
  TAURI_SIGNING_PRIVATE_KEY_PASSWORD: '',
  RUSTFLAGS: remap.map((p, i) => `--remap-path-prefix=${p}=/src${i}`).join(' '),
})

// 检查用户目录和用户名，不检查 basename(root)：项目名正是产品名 / 二进制名，必然命中（remap-path-prefix 已处理真正的路径泄露）
const exe = readFileSync(join(root, 'src-tauri/target/release/portunus.exe'))
for (const word of [homedir(), basename(homedir())]) {
  if (exe.includes(word)) throw new Error(`exe 里还有本机路径：${word}`)
}

const installer = join(root, 'src-tauri/target/release/bundle/nsis', `Portunus_${version}_x64-setup.exe`)
const latest = join(mkdtempSync(join(tmpdir(), 'portunus-release-')), 'latest.json')
writeFileSync(
  latest,
  JSON.stringify({
    version,
    notes: summary,
    pub_date: new Date().toISOString(),
    platforms: {
      'windows-x86_64': {
        signature: readFileSync(`${installer}.sig`, 'utf8'),
        url: `https://github.com/${PUBLIC_REPO}/releases/download/${tag}/${basename(installer)}`,
      },
    },
  }),
)

run('git', ['tag', '-a', tag, '-m', `Portunus ${tag}`])
run('git', ['push', REMOTE, 'HEAD:main', tag])
run('gh', ['release', 'create', tag, installer, latest, '--repo', PUBLIC_REPO, '--title', `Portunus ${tag}`, '--latest', '--notes-file', notesFile])
