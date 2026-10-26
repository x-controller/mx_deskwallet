import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { Wallet, getAddress } from 'ethers'
import { useVaultStore, DEFAULT_GROUP_ID } from './vault'
import { fetchNativeBalance, fetchTokenBalance, runPool, withRetry } from '@/utils/chain'

const uid = () => crypto.randomUUID()
const normalizeKey = (k) => (k.startsWith('0x') ? k : `0x${k}`).toLowerCase()

/** 观察钱包：只有地址没有私钥，能查余额、收款，不能签名 */
export const isWatchWallet = (w) => !w?.privateKey

export const useWalletStore = defineStore('wallet', () => {
  const vault = useVaultStore()

  const wallets = computed(() => vault.data?.wallets ?? [])
  /** 持有私钥、可以签名的钱包（排除观察钱包） */
  const signableWallets = computed(() => wallets.value.filter((w) => !isWatchWallet(w)))
  const watchCount = computed(() => wallets.value.length - signableWallets.value.length)
  const groups = computed(() => vault.data?.groups ?? [])

  /** 多选的钱包 id */
  const selectedIds = ref(new Set())
  /** 余额缓存：`${networkId}:${address}` → { raw: 原生币 bigint | null, tokens: { 合约地址小写: bigint | null }, loading, error } */
  const balances = reactive({})
  const lastRefreshAt = ref(0)

  const balanceKey = (networkId, address) => `${networkId}:${address}`
  const getBalance = (networkId, address) => balances[balanceKey(networkId, address)]

  function nextName(prefix = '钱包') {
    const used = new Set(wallets.value.map((w) => w.name))
    let i = wallets.value.length + 1
    while (used.has(`${prefix} ${i}`)) i++
    return `${prefix} ${i}`
  }

  function pushWallet({ address, privateKey = '', groupId, prefix }) {
    vault.data.wallets.push({
      id: uid(),
      name: nextName(prefix),
      address,
      privateKey,
      groupId: groupId || DEFAULT_GROUP_ID,
      createdAt: Date.now(),
    })
    return address
  }

  /**
   * 批量导入私钥，返回 { added, upgraded, skipped }：
   * 地址已作为观察钱包存在时补上私钥升级为普通钱包，已有私钥的地址跳过
   */
  async function importPrivateKeys(keys, groupId) {
    const byAddress = Object.fromEntries(wallets.value.map((w) => [w.address.toLowerCase(), w]))
    const seen = new Set()
    let added = 0
    let upgraded = 0
    let skipped = 0
    for (const raw of keys) {
      const pk = normalizeKey(raw.trim())
      const w = new Wallet(pk)
      const lower = w.address.toLowerCase()
      if (seen.has(lower)) {
        skipped++
        continue
      }
      seen.add(lower)
      const existing = byAddress[lower]
      if (existing) {
        if (!isWatchWallet(existing)) {
          skipped++
          continue
        }
        existing.privateKey = w.privateKey
        upgraded++
        continue
      }
      pushWallet({ address: w.address, privateKey: w.privateKey, groupId })
      added++
    }
    if (added || upgraded) await vault.persist()
    return { added, upgraded, skipped }
  }

  /** 批量添加观察钱包（只存地址），返回 { added, skipped }（地址已存在则跳过，无论是否观察钱包） */
  async function importWatchAddresses(addresses, groupId) {
    const existing = new Set(wallets.value.map((w) => w.address.toLowerCase()))
    let added = 0
    let skipped = 0
    for (const raw of addresses) {
      const address = getAddress(raw.trim())
      const lower = address.toLowerCase()
      if (existing.has(lower)) {
        skipped++
        continue
      }
      existing.add(lower)
      pushWallet({ address, groupId, prefix: '观察' })
      added++
    }
    if (added) await vault.persist()
    return { added, skipped }
  }

  async function createWallets(count, groupId) {
    const created = []
    for (let i = 0; i < count; i++) {
      const w = Wallet.createRandom()
      created.push(pushWallet({ address: w.address, privateKey: w.privateKey, groupId }))
    }
    await vault.persist()
    return created
  }

  async function updateWallet(id, patch) {
    const w = vault.data.wallets.find((x) => x.id === id)
    if (!w) return
    Object.assign(w, patch)
    await vault.persist()
  }

  async function removeWallets(ids) {
    const set = new Set(ids)
    vault.data.wallets = vault.data.wallets.filter((w) => !set.has(w.id))
    ids.forEach((id) => selectedIds.value.delete(id))
    await vault.persist()
  }

  async function addGroup(name) {
    const g = { id: uid(), name, createdAt: Date.now() }
    vault.data.groups.push(g)
    await vault.persist()
    return g
  }

  async function renameGroup(id, name) {
    const g = vault.data.groups.find((x) => x.id === id)
    if (!g) return
    g.name = name
    await vault.persist()
  }

  /** 删除分组，组内钱包归入默认分组 */
  async function removeGroup(id) {
    if (id === DEFAULT_GROUP_ID) return
    vault.data.groups = vault.data.groups.filter((g) => g.id !== id)
    vault.data.wallets.forEach((w) => {
      if (w.groupId === id) w.groupId = DEFAULT_GROUP_ID
    })
    await vault.persist()
  }

  function toggleSelect(id, checked) {
    if (checked) selectedIds.value.add(id)
    else selectedIds.value.delete(id)
  }

  function setSelected(ids) {
    selectedIds.value = new Set(ids)
  }

  async function refreshBalances(network, addresses) {
    if (!network) return
    const targets = addresses.map((address) => ({ address, key: balanceKey(network.id, address) }))
    const tokens = network.tokens ?? []
    targets.forEach(({ key }) => {
      balances[key] = { raw: balances[key]?.raw ?? null, tokens: balances[key]?.tokens ?? {}, loading: true, error: '' }
    })
    await runPool(targets, 6, async ({ address, key }) => {
      try {
        // 原生币与各 Token 同时查，单个 Token 失败记为 null，不影响其他
        const [raw, ...tokenRaws] = await Promise.all([
          withRetry(() => fetchNativeBalance(network, address)),
          ...tokens.map((t) => withRetry(() => fetchTokenBalance(network, t.address, address)).catch(() => null)),
        ])
        const tokenMap = {}
        tokens.forEach((t, i) => {
          tokenMap[t.address.toLowerCase()] = tokenRaws[i]
        })
        balances[key] = { raw, tokens: tokenMap, loading: false, error: '' }
      } catch (e) {
        balances[key] = { raw: null, tokens: {}, loading: false, error: e?.shortMessage || e?.message || '查询失败' }
      }
    })
    lastRefreshAt.value = Date.now()
  }

  return {
    wallets,
    signableWallets,
    watchCount,
    groups,
    selectedIds,
    balances,
    lastRefreshAt,
    getBalance,
    importPrivateKeys,
    importWatchAddresses,
    createWallets,
    updateWallet,
    removeWallets,
    addGroup,
    renameGroup,
    removeGroup,
    toggleSelect,
    setSelected,
    refreshBalances,
  }
})
