<script setup>
import MdCheckbox from '@/themes/material/components/MdCheckbox.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import { formatAmount } from '@/utils/format'

defineProps({
  /** [{ key, symbol, decimals, native }] */
  assets: { type: Array, default: () => [] },
  /** key → { raw, loading } 所有目标钱包的合计余额 */
  totals: { type: Object, default: () => ({}) },
  /** 已勾选的 key 集合 */
  checked: { type: Set, default: () => new Set() },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['toggle'])
</script>

<template>
  <div class="asset-list">
    <label v-for="a in assets" :key="a.key" class="asset-item" :class="{ 'is-checked': checked.has(a.key), 'is-disabled': disabled }">
      <MdCheckbox :model-value="checked.has(a.key)" :disabled="disabled" @change="emit('toggle', a.key, $event)" />
      <span class="asset-item__symbol md-title-small">{{ a.symbol }}</span>
      <MdChip v-if="a.native" tone="primary">原生币 · 最后转出</MdChip>
      <MdChip v-else>Token</MdChip>
      <span class="asset-item__total md-body-small">
        <MdSkeleton v-if="totals[a.key]?.loading" width="80px" />
        <template v-else-if="totals[a.key]?.raw !== undefined && totals[a.key]?.raw !== null">合计 {{ formatAmount(totals[a.key].raw, a.decimals, 6) }}</template>
        <span v-else class="asset-item__unknown">合计未知</span>
      </span>
    </label>
  </div>
</template>

<style scoped>
.asset-list {
  display: flex;
  flex-direction: column;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  overflow: hidden;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: 48px;
  padding: 0 var(--md-space-3) 0 var(--md-space-1);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  cursor: pointer;
  transition: background var(--md-sys-motion-duration-short2) linear;
}

.asset-item:last-child {
  border-bottom: none;
}

.asset-item:hover:not(.is-disabled) {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.asset-item.is-disabled {
  cursor: not-allowed;
}

.asset-item__symbol {
  color: var(--md-sys-color-on-surface);
}

.asset-item__total {
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
}

.asset-item__unknown {
  color: var(--md-sys-color-outline);
}
</style>
