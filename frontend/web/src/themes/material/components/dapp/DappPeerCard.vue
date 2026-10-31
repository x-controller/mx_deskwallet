<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import { useDappPeer } from '@/composables/dapp/useDappPeer'

const props = defineProps({
  /** WalletConnect peer metadata：{ name, url, icons, description } */
  metadata: { type: Object, default: null },
  verifyContext: { type: Object, default: null },
  /** 紧凑模式：单行，用于会话列表 */
  compact: { type: Boolean, default: false },
})

const { icon, verify, host } = useDappPeer(props)

/** 校验结果 → chip 色调（verifyLabel 的 type 沿用经典命名：info / danger / default） */
const TONE = { info: 'success', danger: 'error', default: 'neutral' }
</script>

<template>
  <div class="peer" :class="{ 'is-compact': compact }">
    <img v-if="icon" :src="icon" class="peer__icon" alt="" loading="lazy" />
    <span v-else class="peer__icon peer__icon--empty"><MdIcon name="language" :size="20" /></span>
    <span class="peer__body">
      <span class="peer__name" :class="compact ? 'md-body-medium' : 'md-title-medium'" :title="metadata?.name">{{ metadata?.name || '未知 dApp' }}</span>
      <span class="peer__host md-body-small" :title="metadata?.url">{{ host }}</span>
    </span>
    <MdChip v-if="verifyContext" :tone="TONE[verify.type] || 'neutral'">{{ verify.text }}</MdChip>
  </div>
</template>

<style scoped>
.peer {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  min-width: 0;
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.is-compact {
  padding: 0;
  background: transparent;
}

.peer__icon {
  width: 40px;
  height: 40px;
  flex-shrink: 0;
  border-radius: var(--md-sys-shape-corner-small);
  object-fit: cover;
}

.is-compact .peer__icon {
  width: 28px;
  height: 28px;
}

.peer__icon--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.peer__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.is-compact .peer__body {
  flex-direction: row;
  align-items: center;
  gap: var(--md-space-2);
}

.peer__name,
.peer__host {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peer__name {
  color: var(--md-sys-color-on-surface);
}

.peer__host {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
