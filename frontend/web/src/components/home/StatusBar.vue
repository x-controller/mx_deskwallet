<script setup>
import { computed } from 'vue'
import { RiDeleteBinLine } from '@remixicon/vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { useWalletStore } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { formatTime } from '@/utils/format'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

const props = defineProps({
  /** wallets 钱包列表 | history 交易记录 */
  mode: { type: String, default: 'wallets' },
})

const walletStore = useWalletStore()
const networkStore = useNetworkStore()
const txStore = useTxStore()

const isHistory = computed(() => props.mode === 'history')
const selectedCount = computed(() => walletStore.selectedIds.size)
const groupOptions = computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))

async function moveTo(groupId) {
  const ids = [...walletStore.selectedIds]
  for (const id of ids) await walletStore.updateWallet(id, { groupId })
  message.success(`已移动 ${ids.length} 个钱包`)
}

async function removeSelected() {
  const ids = [...walletStore.selectedIds]
  const ok = await confirm({ title: '删除钱包', content: `将删除选中的 ${ids.length} 个钱包，无法恢复，请确认普通钱包已备份私钥。`, confirmText: '删除' })
  if (!ok) return
  await walletStore.removeWallets(ids)
  message.success(`已删除 ${ids.length} 个钱包`)
}

async function clearTxs() {
  const ok = await confirm({
    title: '清空交易记录',
    content: `将删除全部 ${txStore.txs.length} 条交易记录（只删除本地记录，不影响链上交易）。`,
    confirmText: '清空',
  })
  if (!ok) return
  await txStore.clear()
  message.success('交易记录已清空')
}
</script>

<template>
  <footer class="status-bar">
    <template v-if="isHistory">
      <span>共 {{ txStore.txs.length }} 条交易记录</span>
      <template v-if="txStore.pendingCount">
        <span class="status-bar__dot">·</span>
        <span>待确认 {{ txStore.pendingCount }}</span>
      </template>
      <MxTooltip v-if="txStore.txs.length" content="清空交易记录">
        <MxButton icon size="sm" aria-label="清空交易记录" @click="clearTxs"><RiDeleteBinLine size="14" /></MxButton>
      </MxTooltip>
    </template>
    <template v-else>
      <span>共 {{ walletStore.wallets.length }} 个钱包<template v-if="walletStore.watchCount">（含 {{ walletStore.watchCount }} 个观察）</template></span>
      <template v-if="selectedCount">
        <span class="status-bar__dot">·</span>
        <span>已选 {{ selectedCount }}</span>
        <MxSelect class="status-bar__move" size="sm" :model-value="null" :options="groupOptions" placeholder="移动到分组" @update:model-value="moveTo" />
        <MxTooltip content="删除选中">
          <MxButton icon size="sm" aria-label="删除选中" @click="removeSelected"><RiDeleteBinLine size="14" /></MxButton>
        </MxTooltip>
        <MxButton size="sm" @click="walletStore.setSelected([])">取消选择</MxButton>
      </template>
    </template>
    <span class="status-bar__right">
      <span v-if="!isHistory && walletStore.lastRefreshAt">余额更新于 {{ formatTime(walletStore.lastRefreshAt) }}</span>
      <span v-if="!isHistory && walletStore.lastRefreshAt && networkStore.activeNetwork" class="status-bar__dot">·</span>
      <span v-if="networkStore.activeNetwork">Chain ID {{ networkStore.activeNetwork.chainId }}</span>
    </span>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-md);
  padding: 0 var(--mx-space-sm) 0 var(--mx-space-md);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.status-bar__dot {
  color: var(--mx-color-text-disabled);
}

.status-bar__move {
  width: 128px;
}

.status-bar__right {
  display: inline-flex;
  gap: var(--mx-space-sm);
  margin-left: auto;
}
</style>
