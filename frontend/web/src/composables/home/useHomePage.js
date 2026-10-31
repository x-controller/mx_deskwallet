import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore, DEFAULT_GROUP_ID } from '@/stores/vault'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { useDappStore } from '@/stores/dapp'
import { useUpdateStore } from '@/stores/update'
import { message } from '@/utils/message'

const PENDING_POLL_MS = 10000
/** 启动后隔多久再检查一次更新 */
const UPDATE_CHECK_MS = 6 * 60 * 60 * 1000

/** 首页的全部状态与流程：列表过滤、批量操作范围、各弹框开关、余额 / 交易轮询、更新检查、锁定 */
export function useHomePage() {
  const router = useRouter()
  const vault = useVaultStore()
  const walletStore = useWalletStore()
  const networkStore = useNetworkStore()
  const txStore = useTxStore()
  const dappStore = useDappStore()
  const updateStore = useUpdateStore()

  /** 主区域：wallets 钱包列表 | history 交易记录 */
  const mode = ref('wallets')
  const activeGroupId = ref('all')
  const keyword = ref('')
  const refreshing = ref(false)
  const dialogs = reactive({ import: false, create: false, watch: false, edit: false, transfer: false, network: false, drain: false, swap: false, font: false, dapp: false, appearance: false })
  const editingWallet = ref(null)
  const transferWallet = ref(null)
  const drainTargets = ref([])
  const swapTargets = ref([])

  const visibleWallets = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    return walletStore.wallets.filter((w) => {
      if (activeGroupId.value !== 'all' && w.groupId !== activeGroupId.value) return false
      if (kw && !w.name.toLowerCase().includes(kw) && !w.address.toLowerCase().includes(kw)) return false
      return true
    })
  })

  /** 地址小写 → 钱包，交易记录按发送方所属分组过滤、按名称搜索时用 */
  const walletByAddress = computed(() => Object.fromEntries(walletStore.wallets.map((w) => [w.address.toLowerCase(), w])))

  const visibleTxs = computed(() => {
    const kw = keyword.value.trim().toLowerCase()
    return txStore.txs.filter((t) => {
      const from = walletByAddress.value[t.from.toLowerCase()]
      if (activeGroupId.value !== 'all' && from?.groupId !== activeGroupId.value) return false
      if (!kw) return true
      const toWallet = walletByAddress.value[t.to.toLowerCase()]
      return [t.hash, t.from, t.to, t.asset.symbol, t.toAsset?.symbol, t.networkName, from?.name, toWallet?.name].some((s) => s && s.toLowerCase().includes(kw))
    })
  })

  const defaultGroupId = computed(() => (activeGroupId.value === 'all' ? DEFAULT_GROUP_ID : activeGroupId.value))

  const selectedVisible = computed(() => visibleWallets.value.filter((w) => walletStore.selectedIds.has(w.id)))
  /** 批量操作的对象：选中则作用于选中，否则作用于当前列表全部；观察钱包没有私钥，一律排除 */
  const batchScope = computed(() => (selectedVisible.value.length ? selectedVisible.value : visibleWallets.value))
  const drainCandidates = computed(() => batchScope.value.filter((w) => !isWatchWallet(w)))
  function batchHint(action) {
    const watchCount = batchScope.value.length - drainCandidates.value.length
    if (!batchScope.value.length) return `${action}（当前没有钱包）`
    if (!drainCandidates.value.length) return `${action}（观察钱包没有私钥，不能${action}）`
    const skip = watchCount ? `，跳过 ${watchCount} 个观察钱包` : ''
    return selectedVisible.value.length
      ? `${action}：选中的 ${drainCandidates.value.length} 个钱包${skip}`
      : `${action}：当前列表全部 ${drainCandidates.value.length} 个钱包${skip}`
  }
  const drainHint = computed(() => batchHint('一键清空'))
  const hasDex = computed(() => (networkStore.activeNetwork?.dexes ?? []).length > 0)
  const swapHint = computed(() => (hasDex.value ? batchHint('兑换') : '当前网络未配置交易所，请先在配置 RPC 里添加'))
  const drainDisabled = computed(() => !drainCandidates.value.length || !networkStore.activeNetwork)
  const swapDisabled = computed(() => !drainCandidates.value.length || !hasDex.value)

  async function refreshBalances(addresses = walletStore.wallets.map((w) => w.address)) {
    if (!networkStore.activeNetwork || !addresses.length) return
    refreshing.value = true
    try {
      await walletStore.refreshBalances(networkStore.activeNetwork, addresses)
    } finally {
      refreshing.value = false
    }
  }

  async function refreshPendingTxs() {
    if (!txStore.pendingCount) return
    refreshing.value = true
    try {
      await txStore.refreshPending(networkStore.networks)
    } finally {
      refreshing.value = false
    }
  }

  function refresh() {
    return mode.value === 'history' ? refreshPendingTxs() : refreshBalances()
  }

  /** 只补查还没有余额记录的钱包（导入 / 创建之后） */
  function refreshMissing() {
    const net = networkStore.activeNetwork
    if (!net) return
    refreshBalances(walletStore.wallets.filter((w) => !walletStore.getBalance(net.id, w.address)).map((w) => w.address))
  }

  function openDrain(targets) {
    targets = targets.filter((w) => !isWatchWallet(w))
    if (!networkStore.activeNetwork || !targets.length) return
    drainTargets.value = targets
    dialogs.drain = true
  }

  function openSwap(targets) {
    targets = targets.filter((w) => !isWatchWallet(w))
    if (!hasDex.value || !targets.length) return
    swapTargets.value = targets
    dialogs.swap = true
  }

  function openTransfer(wallet) {
    if (!networkStore.activeNetwork || isWatchWallet(wallet)) return
    transferWallet.value = wallet
    dialogs.transfer = true
  }

  function openEdit(wallet) {
    editingWallet.value = wallet
    dialogs.edit = true
  }

  function lock() {
    walletStore.setSelected([])
    vault.lock()
    router.replace({ name: 'unlock' })
  }

  /** 转账 / 清空 / 兑换完成后只刷新涉及的钱包 */
  const refreshTransfer = () => refreshBalances([transferWallet.value.address])
  const refreshDrain = () => refreshBalances(drainTargets.value.map((w) => w.address))
  const refreshSwap = () => refreshBalances(swapTargets.value.map((w) => w.address))

  watch(
    () => networkStore.activeNetworkId,
    () => refreshBalances(),
  )

  /* 有待确认交易时后台轮询回执（上次会话遗留的待确认记录也靠这里补齐） */
  let pollTimer
  let updateTimer
  onMounted(() => {
    refreshBalances()
    txStore.refreshPending(networkStore.networks)
    // 配置过 Project ID 才连中继；失败只提示，不影响钱包其他功能
    dappStore.init().catch((e) => message.error(`WalletConnect 初始化失败：${e?.message || e}`))
    pollTimer = setInterval(() => {
      if (txStore.pendingCount) txStore.refreshPending(networkStore.networks)
    }, PENDING_POLL_MS)
    // 自动检查失败（没网等）不打扰用户，点状态栏版本号手动检查时才提示
    updateStore.init().catch(() => {})
    updateStore.check().catch(() => {})
    updateTimer = setInterval(() => updateStore.check().catch(() => {}), UPDATE_CHECK_MS)
  })

  onBeforeUnmount(() => {
    clearInterval(pollTimer)
    clearInterval(updateTimer)
  })

  return {
    walletStore, networkStore, txStore, dappStore,
    mode, activeGroupId, keyword, refreshing, dialogs,
    editingWallet, transferWallet, drainTargets, swapTargets,
    visibleWallets, visibleTxs, defaultGroupId, drainCandidates,
    drainHint, swapHint, drainDisabled, swapDisabled, hasDex,
    refresh, refreshMissing, refreshTransfer, refreshDrain, refreshSwap,
    openDrain, openSwap, openTransfer, openEdit, lock,
  }
}
