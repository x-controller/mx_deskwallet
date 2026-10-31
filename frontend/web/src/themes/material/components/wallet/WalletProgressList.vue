<script setup>
import MdChip from '@/themes/material/components/MdChip.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
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
  pending: { tone: 'neutral', text: '待执行' },
  running: { tone: 'primary', text: '进行中' },
  done: { tone: 'success', text: '完成' },
  failed: { tone: 'error', text: '失败' },
}
</script>

<template>
  <div class="progress-list">
    <div v-for="w in wallets" :key="w.id" class="progress-item md-body-small">
      <span class="progress-item__name" :title="w.name">{{ w.name }}</span>
      <span class="progress-item__address md-mono">{{ shortAddress(displayAddress(w), 8, 6) }}</span>
      <MdChip :tone="STATUS[progress[w.id]?.status || 'pending'].tone">
        <template v-if="progress[w.id]?.status === 'running'" #icon><MdProgress :size="12" /></template>
        {{ STATUS[progress[w.id]?.status || 'pending'].text }}
      </MdChip>
      <MdTooltip :content="progress[w.id]?.last || ''">
        <span class="progress-item__last" :class="{ 'md-error-text': progress[w.id]?.lastType === 'error' }">{{ progress[w.id]?.last || '' }}</span>
      </MdTooltip>
    </div>
  </div>
</template>

<style scoped>
.progress-list {
  display: flex;
  flex-direction: column;
  max-height: 220px;
  overflow-y: auto;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.progress-item {
  display: grid;
  grid-template-columns: minmax(80px, 1fr) 150px 80px minmax(120px, 2fr);
  align-items: center;
  gap: var(--md-space-3);
  height: 36px;
  padding: 0 var(--md-space-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.progress-item:last-child {
  border-bottom: none;
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
  color: var(--md-sys-color-on-surface-variant);
}
</style>
