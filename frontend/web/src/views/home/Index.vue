<script setup>
import { computed, onMounted, reactive, ref, watch } from 'vue'
import { useRouter } from 'vue-router'
import HomeTopBar from '@/components/home/HomeTopBar.vue'
import GroupSidebar from '@/components/home/GroupSidebar.vue'
import WalletTable from '@/components/home/WalletTable.vue'
import StatusBar from '@/components/home/StatusBar.vue'
import ImportWalletDialog from '@/components/wallet/ImportWalletDialog.vue'
import CreateWalletDialog from '@/components/wallet/CreateWalletDialog.vue'
import EditWalletDialog from '@/components/wallet/EditWalletDialog.vue'
import NetworkDialog from '@/components/network/NetworkDialog.vue'
import DrainDialog from '@/components/drain/DrainDialog.vue'
import { useVaultStore, DEFAULT_GROUP_ID } from '@/stores/vault'
import { useWalletStore } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'

const router = useRouter()
const vault = useVaultStore()
const walletStore = useWalletStore()
const networkStore = useNetworkStore()

const activeGroupId = ref('all')
const keyword = ref('')
const refreshing = ref(false)
const dialogs = reactive({ import: false, create: false, edit: false, network: false, drain: false })
const editingWallet = ref(null)
const drainTargets = ref([])

const visibleWallets = computed(() => {
  const kw = keyword.value.trim().toLowerCase()
  return walletStore.wallets.filter((w) => {
    if (activeGroupId.value !== 'all' && w.groupId !== activeGroupId.value) return false
    if (kw && !w.name.toLowerCase().includes(kw) && !w.address.toLowerCase().includes(kw)) return false
    return true
  })
})

const defaultGroupId = computed(() => (activeGroupId.value === 'all' ? DEFAULT_GROUP_ID : activeGroupId.value))

const selectedVisible = computed(() => visibleWallets.value.filter((w) => walletStore.selectedIds.has(w.id)))
const drainCandidates = computed(() => (selectedVisible.value.length ? selectedVisible.value : visibleWallets.value))
const drainHint = computed(() => {
  if (!drainCandidates.value.length) return '一键清空（当前没有钱包）'
  return selectedVisible.value.length
    ? `一键清空：选中的 ${selectedVisible.value.length} 个钱包`
    : `一键清空：当前列表全部 ${visibleWallets.value.length} 个钱包`
})

async function refresh(addresses = walletStore.wallets.map((w) => w.address)) {
  if (!networkStore.activeNetwork || !addresses.length) return
  refreshing.value = true
  try {
    await walletStore.refreshBalances(networkStore.activeNetwork, addresses)
  } finally {
    refreshing.value = false
  }
}

/** 只补查还没有余额记录的钱包（导入 / 创建之后） */
function refreshMissing() {
  const net = networkStore.activeNetwork
  if (!net) return
  refresh(walletStore.wallets.filter((w) => !walletStore.getBalance(net.id, w.address)).map((w) => w.address))
}

function openDrain(targets) {
  if (!networkStore.activeNetwork || !targets.length) return
  drainTargets.value = targets
  dialogs.drain = true
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
  () => refresh(),
)

onMounted(() => refresh())
</script>

<template>
  <div class="home">
    <HomeTopBar
      v-model:keyword="keyword"
      :refreshing="refreshing"
      :drain-hint="drainHint"
      :drain-disabled="!drainCandidates.length || !networkStore.activeNetwork"
      @import="dialogs.import = true"
      @create="dialogs.create = true"
      @drain="openDrain(drainCandidates)"
      @network="dialogs.network = true"
      @refresh="refresh()"
      @lock="lock"
    />

    <div class="home__body">
      <GroupSidebar v-model="activeGroupId" />
      <WalletTable
        :wallets="visibleWallets"
        :filtered="walletStore.wallets.length > 0"
        @edit="openEdit"
        @drain="openDrain([$event])"
        @import="dialogs.import = true"
        @create="dialogs.create = true"
      />
    </div>

    <StatusBar />

    <ImportWalletDialog v-model="dialogs.import" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <CreateWalletDialog v-model="dialogs.create" :default-group-id="defaultGroupId" @done="refreshMissing" />
    <EditWalletDialog v-model="dialogs.edit" :wallet="editingWallet" />
    <NetworkDialog v-model="dialogs.network" />
    <DrainDialog v-model="dialogs.drain" :wallets="drainTargets" :network="networkStore.activeNetwork" @done="refresh(drainTargets.map((w) => w.address))" />
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
