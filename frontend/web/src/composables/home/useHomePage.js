import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore, DEFAULT_GROUP_ID } from '@/stores/vault'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { useDappStore } from '@/stores/dapp'
import { useUpdateStore } from '@/stores/update'
import { message } from '@/utils/message'
import { isTron } from '@/utils/chain'
import { addressKey } from '@/utils/validate'

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
  const dialogs = reactive({ import: false, create: false, watch: false, edit: false, transfer: false, batch: false, collect: false, network: false, drain: false, swap: false, font: false, dapp: false, appearance: false })
  const editingWallet = ref(null)
  const transferWallet = ref(null)
  const drainTargets = ref([])
  const swapTargets = ref([])
  const collectTargets = ref([])
  /** 批量转账打开时预选的转出钱包 */
  const batchSender = ref(null)

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
      const toWallet = walletByAddress.value[addressKey(t.to)]
      return [t.hash, t.from, t.to, t.asset.symbol, t.toAsset?.symbol, t.networkName, from?.name, toWallet?.name].some((s) => s && s.toLowerCase().includes(kw))
    })
  })

  const defaultGroupId = computed(() => (activeGroupId.value === 'all' ? DEFAULT_GROUP_ID : activeGroupId.value))

  const selectedVisible = computed(() => visibleWallets.value.filter((w) => walletStore.selectedIds.has(w.id)))
  /** 批量操作的对象：选中则作用于选中，否则作用于当前列表全部；观察钱包没有私钥，一律排除 */
  const batchScope = computed(() => (selectedVisible.value.length ? selectedVisible.value : visibleWallets.value))
  const drainCandidates = computed(() => batchScope.value.filter((w) => !isWatchWallet(w)))
  /** 批量操作作用范围的说明文字（顶栏「批量操作」菜单里显示在操作名下方） */
  function scopeHint(action) {
    const watchCount = batchScope.value.length - drainCandidates.value.length
    if (!batchScope.value.length) return '当前没有钱包'
    if (!drainCandidates.value.length) return `观察钱包没有私钥，不能${action}`
    const skip = watchCount ? `，跳过 ${watchCount} 个观察钱包` : ''
    return selectedVisible.value.length
      ? `选中的 ${drainCandidates.value.length} 个钱包${skip}`
      : `当前列表全部 ${drainCandidates.value.length} 个钱包${skip}`
  }
  const drainHint = computed(() => scopeHint('清空'))
  const hasDex = computed(() => (networkStore.activeNetwork?.dexes ?? []).length > 0)
  const swapHint = computed(() => (hasDex.value ? scopeHint('兑换') : isTron(networkStore.activeNetwork) ? 'Tron 网络暂不支持兑换' : '当前网络未配置交易所，请先在配置 RPC 里添加'))
  const drainDisabled = computed(() => !drainCandidates.value.length || !networkStore.activeNetwork)
  const swapDisabled = computed(() => !drainCandidates.value.length || !hasDex.value)
  const collectHint = computed(() => scopeHint('转账'))
  const collectDisabled = drainDisabled
  const batchHintText = computed(() => {
    if (!walletStore.signableWallets.length) return '没有持有私钥的钱包'
    return selectedVisible.value.length === 1 && !isWatchWallet(selectedVisible.value[0])
      ? `从「${selectedVisible.value[0].name}」向多个地址转账`
      : '从一个钱包向多个地址转账'
  })
  const batchDisabled = computed(() => !walletStore.signableWallets.length || !networkStore.activeNetwork)

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

  function openCollect(targets) {
    targets = targets.filter((w) => !isWatchWallet(w))
    if (!networkStore.activeNetwork || !targets.length) return
    collectTargets.value = targets
    dialogs.collect = true
  }

  /** 批量转账：只选了一个可签名钱包就预选它，否则取列表第一个 */
  function openBatch() {
    if (!networkStore.activeNetwork || !walletStore.signableWallets.length) return
    const picked = selectedVisible.value.length === 1 && !isWatchWallet(selectedVisible.value[0]) ? selectedVisible.value[0] : null
    batchSender.value = picked ?? visibleWallets.value.find((w) => !isWatchWallet(w)) ?? walletStore.signableWallets[0]
    dialogs.batch = true
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
  const refreshCollect = () => refreshBalances(collectTargets.value.map((w) => w.address))
  /** 批量转账只刷新转出钱包和收款方里属于本金库的地址 */
  const refreshBatch = ({ from, recipients }) => refreshBalances([...new Set([from, ...recipients].map((a) => walletByAddress.value[addressKey(a)]?.address).filter(Boolean))])

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
    editingWallet, transferWallet, drainTargets, swapTargets, collectTargets, batchSender,
    visibleWallets, visibleTxs, defaultGroupId, drainCandidates, batchScope,
    drainHint, swapHint, drainDisabled, swapDisabled, hasDex,
    collectHint, collectDisabled, batchHintText, batchDisabled,
    refresh, refreshMissing, refreshTransfer, refreshDrain, refreshSwap, refreshCollect, refreshBatch,
    openDrain, openSwap, openCollect, openBatch, openTransfer, openEdit, lock,
  }
}
