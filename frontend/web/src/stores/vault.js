import { defineStore } from 'pinia'
import { ref } from 'vue'
import { readVault, writeVault, clearVault } from '@/utils/storage'
import { deriveKey, encryptJson, decryptJson, randomBytes, toBase64, fromBase64 } from '@/utils/crypto'
import { NETWORK_PRESETS } from '@/utils/presets'

export const DEFAULT_GROUP_ID = 'default'

function createDefaultData() {
  return {
    groups: [{ id: DEFAULT_GROUP_ID, name: '默认', createdAt: Date.now() }],
    wallets: [],
    networks: structuredClone(NETWORK_PRESETS),
    activeNetworkId: NETWORK_PRESETS[0].id,
  }
}

/**
 * 本地金库：所有业务数据（钱包 / 分组 / 网络）加密保存在同一个文件里，
 * 解锁后在内存中以响应式对象形式提供给各业务 store
 */
export const useVaultStore = defineStore('vault', () => {
  /** loading | new | locked | unlocked */
  const status = ref('loading')
  const data = ref(null)
  let key = null
  let salt = null

  async function init() {
    if (status.value !== 'loading') return
    const saved = await readVault()
    status.value = saved ? 'locked' : 'new'
  }

  async function persist() {
    const payload = await encryptJson(key, data.value)
    await writeVault({ v: 1, salt: toBase64(salt), ...payload })
  }

  async function setup(password) {
    salt = randomBytes(16)
    key = await deriveKey(password, salt)
    data.value = createDefaultData()
    await persist()
    status.value = 'unlocked'
  }

  async function unlock(password) {
    const saved = await readVault()
    const s = fromBase64(saved.salt)
    const k = await deriveKey(password, s)
    let plain
    try {
      plain = await decryptJson(k, saved)
    } catch {
      throw new Error('口令错误')
    }
    key = k
    salt = s
    data.value = { ...createDefaultData(), ...plain }
    status.value = 'unlocked'
  }

  function lock() {
    key = null
    salt = null
    data.value = null
    status.value = 'locked'
  }

  async function reset() {
    await clearVault()
    lock()
    status.value = 'new'
  }

  return { status, data, init, setup, unlock, lock, reset, persist }
})
