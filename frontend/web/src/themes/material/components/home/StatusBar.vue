<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { formatTime } from '@/utils/format'
import { useStatusBar } from '@/composables/home/useStatusBar'

const props = defineProps({
  /** wallets 钱包列表 | history 交易记录 */
  mode: { type: String, default: 'wallets' },
})

const { walletStore, networkStore, txStore, updateStore, isHistory, selectedCount, groupOptions, moveTo, removeSelected, clearTxs, checkUpdate } = useStatusBar(props)
</script>

<template>
  <footer class="status-bar md-body-small">
    <template v-if="isHistory">
      <span>共 {{ txStore.txs.length }} 条交易记录</span>
      <template v-if="txStore.pendingCount">
        <span class="status-bar__dot">·</span>
        <span>待确认 {{ txStore.pendingCount }}</span>
      </template>
      <MdTooltip v-if="txStore.txs.length" content="清空交易记录">
        <MdIconButton size="sm" aria-label="清空交易记录" @click="clearTxs"><MdIcon name="delete" /></MdIconButton>
      </MdTooltip>
    </template>
    <template v-else>
      <span>共 {{ walletStore.wallets.length }} 个钱包<template v-if="walletStore.watchCount">（含 {{ walletStore.watchCount }} 个观察）</template></span>
      <template v-if="selectedCount">
        <span class="status-bar__dot">·</span>
        <span class="status-bar__selected">已选 {{ selectedCount }}</span>
        <MdSelect class="status-bar__move" dense :model-value="null" :options="groupOptions" placeholder="移动到分组" @update:model-value="moveTo" />
        <MdTooltip content="删除选中">
          <MdIconButton size="sm" color="error" aria-label="删除选中" @click="removeSelected"><MdIcon name="delete" /></MdIconButton>
        </MdTooltip>
        <MdButton variant="text" dense @click="walletStore.setSelected([])">取消选择</MdButton>
      </template>
    </template>
    <span class="status-bar__right">
      <span v-if="updateStore.phase" class="status-bar__updating"><MdProgress :size="14" />{{ updateStore.statusText }}</span>
      <MdButton v-else-if="updateStore.available" variant="tonal" dense @click="updateStore.install()">
        <template #icon><MdIcon name="download" /></template>
        新版本 v{{ updateStore.available.version }}
      </MdButton>
      <span v-if="!isHistory && walletStore.lastRefreshAt">余额更新于 {{ formatTime(walletStore.lastRefreshAt) }}</span>
      <span v-if="!isHistory && walletStore.lastRefreshAt && networkStore.activeNetwork" class="status-bar__dot">·</span>
      <span v-if="networkStore.activeNetwork">Chain ID {{ networkStore.activeNetwork.chainId }}</span>
      <MdTooltip v-if="updateStore.version" content="检查更新">
        <MdButton variant="text" dense :loading="updateStore.checking" :disabled="!!updateStore.phase" @click="checkUpdate">v{{ updateStore.version }}</MdButton>
      </MdTooltip>
    </span>
  </footer>
</template>

<style scoped>
.status-bar {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: 44px;
  padding: 0 var(--md-space-4) 0 var(--md-space-5);
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.status-bar__dot {
  color: var(--md-sys-color-outline);
}

.status-bar__selected {
  color: var(--md-sys-color-primary);
  font-weight: var(--md-sys-typescale-weight-medium);
}

.status-bar__move {
  width: 150px;
}

.status-bar__right {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-2);
  margin-left: auto;
}

.status-bar__updating {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
}
</style>
