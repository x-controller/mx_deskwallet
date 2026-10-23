/**
 * 金库落盘：Tauri 环境走 plugin-store（应用数据目录 vault.json），
 * 纯浏览器调试时退化为 localStorage
 */
export const isTauri = typeof window !== 'undefined' && '__TAURI_INTERNALS__' in window

const KEY = 'vault'
const LOCAL_KEY = 'mx-vault'
let storePromise

async function getStore() {
  if (!storePromise) {
    storePromise = import('@tauri-apps/plugin-store').then(({ load }) => load('vault.json', { autoSave: false, defaults: {} }))
  }
  return storePromise
}

export async function readVault() {
  if (!isTauri) {
    const raw = localStorage.getItem(LOCAL_KEY)
    return raw ? JSON.parse(raw) : null
  }
  const store = await getStore()
  return (await store.get(KEY)) ?? null
}

export async function writeVault(value) {
  if (!isTauri) {
    localStorage.setItem(LOCAL_KEY, JSON.stringify(value))
    return
  }
  const store = await getStore()
  await store.set(KEY, value)
  await store.save()
}

export async function clearVault() {
  if (!isTauri) {
    localStorage.removeItem(LOCAL_KEY)
    return
  }
  const store = await getStore()
  await store.delete(KEY)
  await store.save()
}

export async function copyText(text) {
  if (isTauri) {
    const { writeText } = await import('@tauri-apps/plugin-clipboard-manager')
    await writeText(text)
    return
  }
  await navigator.clipboard.writeText(text)
}
