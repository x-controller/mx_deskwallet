<script setup>
import { RiDeleteBinLine, RiDownloadLine } from '@remixicon/vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxSpinner from '@/themes/classic/components/MxSpinner.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import { formatTime } from '@/utils/format'
import { useStatusBar } from '@/composables/home/useStatusBar'

const props = defineProps({
  /** wallets 钱包列表 | history 交易记录 */
  mode: { type: String, default: 'wallets' },
})

const { walletStore, networkStore, txStore, updateStore, isHistory, selectedCount, groupOptions, chainLabel, moveTo, removeSelected, clearTxs, checkUpdate } = useStatusBar(props)
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
      <span v-if="updateStore.phase" class="status-bar__updating"><MxSpinner :size="12" />{{ updateStore.statusText }}</span>
      <MxButton v-else-if="updateStore.available" size="sm" @click="updateStore.install()">
        <RiDownloadLine size="14" />
        新版本 v{{ updateStore.available.version }}
      </MxButton>
      <span v-if="!isHistory && walletStore.lastRefreshAt">余额更新于 {{ formatTime(walletStore.lastRefreshAt) }}</span>
      <span v-if="!isHistory && walletStore.lastRefreshAt && networkStore.activeNetwork" class="status-bar__dot">·</span>
      <span v-if="chainLabel">{{ chainLabel }}</span>
      <MxTooltip v-if="updateStore.version" content="检查更新">
        <MxButton size="sm" :loading="updateStore.checking" :disabled="!!updateStore.phase" @click="checkUpdate">v{{ updateStore.version }}</MxButton>
      </MxTooltip>
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
  align-items: center;
  gap: var(--mx-space-sm);
  margin-left: auto;
}

.status-bar__updating {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
}
</style>
