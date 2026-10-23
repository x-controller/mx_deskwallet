import { defineStore } from 'pinia'
import { computed, reactive, ref } from 'vue'
import { Wallet } from 'ethers'
import { useVaultStore, DEFAULT_GROUP_ID } from './vault'
import { fetchNativeBalance, runPool } from '@/utils/chain'

const uid = () => crypto.randomUUID()
const normalizeKey = (k) => (k.startsWith('0x') ? k : `0x${k}`).toLowerCase()

export const useWalletStore = defineStore('wallet', () => {
  const vault = useVaultStore()

  const wallets = computed(() => vault.data?.wallets ?? [])
  const groups = computed(() => vault.data?.groups ?? [])

  /** 多选的钱包 id */
  const selectedIds = ref(new Set())
  /** 余额缓存：`${networkId}:${address}` → { raw: bigint | null, loading, error } */
  const balances = reactive({})
  const lastRefreshAt = ref(0)

  const balanceKey = (networkId, address) => `${networkId}:${address}`
  const getBalance = (networkId, address) => balances[balanceKey(networkId, address)]

  function nextName() {
    const used = new Set(wallets.value.map((w) => w.name))
    let i = wallets.value.length + 1
    while (used.has(`钱包 ${i}`)) i++
    return `钱包 ${i}`
  }

  function pushWallet(privateKey, groupId) {
    const w = new Wallet(privateKey)
    vault.data.wallets.push({
      id: uid(),
      name: nextName(),
      address: w.address,
      privateKey: w.privateKey,
      groupId: groupId || DEFAULT_GROUP_ID,
      createdAt: Date.now(),
    })
    return w.address
  }

  /** 批量导入私钥，返回 { added, skipped }（已存在的地址会跳过） */
  async function importPrivateKeys(keys, groupId) {
    const existing = new Set(wallets.value.map((w) => w.address.toLowerCase()))
    const seen = new Set()
    let added = 0
    let skipped = 0
    for (const raw of keys) {
      const pk = normalizeKey(raw.trim())
      const address = new Wallet(pk).address.toLowerCase()
      if (existing.has(address) || seen.has(address)) {
        skipped++
        continue
      }
      seen.add(address)
      pushWallet(pk, groupId)
      added++
    }
    if (added) await vault.persist()
    return { added, skipped }
  }

  async function createWallets(count, groupId) {
    const created = []
    for (let i = 0; i < count; i++) created.push(pushWallet(Wallet.createRandom().privateKey, groupId))
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
    targets.forEach(({ key }) => {
      balances[key] = { raw: balances[key]?.raw ?? null, loading: true, error: '' }
    })
    await runPool(targets, 6, async ({ address, key }) => {
      try {
        const raw = await fetchNativeBalance(network, address)
        balances[key] = { raw, loading: false, error: '' }
      } catch (e) {
        balances[key] = { raw: null, loading: false, error: e?.shortMessage || e?.message || '查询失败' }
      }
    })
    lastRefreshAt.value = Date.now()
  }

  return {
    wallets,
    groups,
    selectedIds,
    balances,
    lastRefreshAt,
    getBalance,
    importPrivateKeys,
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
