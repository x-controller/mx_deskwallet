<script setup>
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxSpinner from '@/themes/classic/components/MxSpinner.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import { shortAddress } from '@/utils/format'
import { chainAddress } from '@/utils/chain'

const props = defineProps({
  wallets: { type: Array, default: () => [] },
  /** walletId → { status: pending | running | done | failed, last: string } */
  progress: { type: Object, default: () => ({}) },
  /** 传入时钱包地址按该网络的写法显示（Tron 显示 T 地址）；不传则原样显示 */
  network: { type: Object, default: null },
})

const displayAddress = (w) => (props.network ? chainAddress(props.network, w.address) : w.address)

const STATUS = {
  pending: { type: 'default', text: '待执行' },
  running: { type: 'info', text: '进行中' },
  done: { type: 'info', text: '完成' },
  failed: { type: 'danger', text: '失败' },
}
</script>

<template>
  <div class="progress-list">
    <div v-for="w in wallets" :key="w.id" class="progress-item">
      <span class="progress-item__name" :title="w.name">{{ w.name }}</span>
      <span class="progress-item__address">{{ shortAddress(displayAddress(w), 8, 6) }}</span>
      <MxTag :type="STATUS[progress[w.id]?.status || 'pending'].type">
        <MxSpinner v-if="progress[w.id]?.status === 'running'" :size="10" />
        {{ STATUS[progress[w.id]?.status || 'pending'].text }}
      </MxTag>
      <MxTooltip :content="progress[w.id]?.last || ''">
        <span class="progress-item__last" :class="{ 'is-error': progress[w.id]?.lastType === 'error' }">{{ progress[w.id]?.last || '' }}</span>
      </MxTooltip>
    </div>
  </div>
</template>

<style scoped>
.progress-list {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
}

.progress-item {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) 140px 72px minmax(120px, 2fr);
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-sm);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.progress-item__name,
.progress-item__last {
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.progress-item__address,
.progress-item__last {
  color: var(--mx-color-text-secondary);
}

.progress-item__last.is-error {
  color: var(--mx-color-danger);
}
</style>
