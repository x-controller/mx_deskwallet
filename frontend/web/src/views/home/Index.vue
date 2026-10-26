<script setup>
import { computed, onBeforeUnmount, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import HomeTopBar from '@/components/home/HomeTopBar.vue'
import GroupSidebar from '@/components/home/GroupSidebar.vue'
import WalletTable from '@/components/home/WalletTable.vue'
import StatusBar from '@/components/home/StatusBar.vue'
import TxTable from '@/components/tx/TxTable.vue'
import ImportWalletDialog from '@/components/wallet/ImportWalletDialog.vue'
import WatchWalletDialog from '@/components/wallet/WatchWalletDialog.vue'
import CreateWalletDialog from '@/components/wallet/CreateWalletDialog.vue'
import EditWalletDialog from '@/components/wallet/EditWalletDialog.vue'
import TransferDialog from '@/components/wallet/TransferDialog.vue'
import NetworkDialog from '@/components/network/NetworkDialog.vue'
import DrainDialog from '@/components/drain/DrainDialog.vue'
import SwapDialog from '@/components/swap/SwapDialog.vue'
import DappDialog from '@/components/dapp/DappDialog.vue'
import DappProposalDialog from '@/components/dapp/DappProposalDialog.vue'
import DappRequestDialog from '@/components/dapp/DappRequestDialog.vue'
import FontDialog from '@/components/home/FontDialog.vue'
import { useVaultStore, DEFAULT_GROUP_ID } from '@/stores/vault'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { useDappStore } from '@/stores/dapp'
import { message } from '@/utils/message'

const PENDING_POLL_MS = 10000

const router = useRouter()
const vault = useVaultStore()
const walletStore = useWalletStore()
const networkStore = useNetworkStore()
const txStore = useTxStore()
const dappStore = useDappStore()

/** 主区域：wallets 钱包列表 | history 交易记录 */
const mode = ref('wallets')
const activeGroupId = ref('all')
const keyword = ref('')
const refreshing = ref(false)
const dialogs = reactive({ import: false, create: false, watch: false, edit: false, transfer: false, network: false, drain: false, swap: false, font: false, dapp: false })
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
  const watch = batchScope.value.length - drainCandidates.value.length
  if (!batchScope.value.length) return `${action}（当前没有钱包）`
  if (!drainCandidates.value.length) return `${action}（观察钱包没有私钥，不能${action}）`
  const skip = watch ? `，跳过 ${watch} 个观察钱包` : ''
  return selectedVisible.value.length
    ? `${action}：选中的 ${drainCandidates.value.length} 个钱包${skip}`
    : `${action}：当前列表全部 ${drainCandidates.value.length} 个钱包${skip}`
}
const drainHint = computed(() => batchHint('一键清空'))
const hasDex = computed(() => (networkStore.activeNetwork?.dexes ?? []).length > 0)
const swapHint = computed(() => (hasDex.value ? batchHint('兑换') : '当前网络未配置交易所，请先在配置 RPC 里添加'))

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

watch(
  () => networkStore.activeNetworkId,
  () => refreshBalances(),
)

/* 有待确认交易时后台轮询回执（上次会话遗留的待确认记录也靠这里补齐） */
let pollTimer
onMounted(() => {
  refreshBalances()
  txStore.refreshPending(networkStore.networks)
  // 配置过 Project ID 才连中继；失败只提示，不影响钱包其他功能
  dappStore.init().catch((e) => message.error(`WalletConnect 初始化失败：${e?.message || e}`))
  pollTimer = setInterval(() => {
    if (txStore.pendingCount) txStore.refreshPending(networkStore.networks)
  }, PENDING_POLL_MS)
})

onBeforeUnmount(() => clearInterval(pollTimer))
</script>

<template>
  <div class="home">
    <HomeTopBar
      v-model:keyword="keyword"
      v-model:mode="mode"
      :refreshing="refreshing"
      :drain-hint="drainHint"
      :drain-disabled="!drainCandidates.length || !networkStore.activeNetwork"
      :swap-hint="swapHint"
      :swap-disabled="!drainCandidates.length || !hasDex"
      :dapp-pending="dappStore.pendingCount"
      @dapp="dialogs.dapp = true"
      @import="dialogs.import = true"
      @create="dialogs.create = true"
      @watch="dialogs.watch = true"
      @drain="openDrain(drainCandidates)"
      @swap="openSwap(drainCandidates)"
      @network="dialogs.network = true"
      @refresh="refresh"
      @font="dialogs.font = true"
      @lock="lock"
    />

    <div class="home__body">
      <GroupSidebar v-model="activeGroupId" />
      <TxTable v-if="mode === 'history'" :txs="visibleTxs" :filtered="txStore.txs.length > 0" />
      <WalletTable
        v-else
        :wallets="visibleWallets"
        :filtered="walletStore.wallets.length > 0"
        @edit="openEdit"
        @transfer="openTransfer"
        @swap="openSwap([$event])"
        @drain="openDrain([$event])"
        @import="dialogs.import = true"
        @create="dialogs.create = true"
        @watch="dialogs.watch = true"
      />
    </div>

    <StatusBar :mode="mode" />

    <ImportWalletDialog v-model="dialogs.import" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <CreateWalletDialog v-model="dialogs.create" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <WatchWalletDialog v-model="dialogs.watch" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <EditWalletDialog v-model="dialogs.edit" :wallet="editingWallet" />
    <TransferDialog v-model="dialogs.transfer" :wallet="transferWallet" :network="networkStore.activeNetwork" @done="refreshBalances([transferWallet.address])" />
    <NetworkDialog v-model="dialogs.network" />
    <FontDialog v-model="dialogs.font" />
    <DrainDialog v-model="dialogs.drain" :wallets="drainTargets" :network="networkStore.activeNetwork" @done="refreshBalances(drainTargets.map((w) => w.address))" />
    <SwapDialog v-model="dialogs.swap" :wallets="swapTargets" :network="networkStore.activeNetwork" @done="refreshBalances(swapTargets.map((w) => w.address))" />
    <DappDialog v-model="dialogs.dapp" />
    <DappProposalDialog v-if="dappStore.currentProposal" :key="dappStore.currentProposal.id" :proposal="dappStore.currentProposal" />
    <DappRequestDialog v-else-if="dappStore.currentRequest" :key="dappStore.currentRequest.id" :request="dappStore.currentRequest" />
  </div>
</template>

<style scoped>
.home {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
  height: 100%;
  padding: var(--mx-space-sm);
}

.home__body {
  display: flex;
  flex: 1;
  min-height: 0;
  gap: var(--mx-space-sm);
}
</style>
