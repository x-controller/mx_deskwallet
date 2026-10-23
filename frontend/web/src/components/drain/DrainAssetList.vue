<script setup>
import MxCheckbox from '@/components/MxCheckbox.vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import MxTag from '@/components/MxTag.vue'
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
    <div v-for="a in assets" :key="a.key" class="asset-item" :class="{ 'is-checked': checked.has(a.key) }">
      <MxCheckbox :model-value="checked.has(a.key)" :disabled="disabled" @change="emit('toggle', a.key, $event)">
        <span class="asset-item__symbol">{{ a.symbol }}</span>
      </MxCheckbox>
      <MxTag v-if="a.native" type="info">原生币 · 最后转出</MxTag>
      <MxTag v-else>Token</MxTag>
      <span class="asset-item__total">
        <MxSkeleton v-if="totals[a.key]?.loading" width="80px" />
        <template v-else-if="totals[a.key]?.raw !== undefined && totals[a.key]?.raw !== null">
          合计 {{ formatAmount(totals[a.key].raw, a.decimals, 6) }}
        </template>
        <span v-else class="asset-item__unknown">合计未知</span>
      </span>
    </div>
  </div>
</template>

<style scoped>
.asset-list {
  display: flex;
  flex-direction: column;
}

.asset-item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-md);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  transition: background var(--mx-transition);
}

.asset-item:hover {
  background: var(--mx-color-bg-hover);
}

.asset-item.is-checked {
  background: var(--mx-color-bg-active);
}

.asset-item__symbol {
  font-weight: 600;
}

.asset-item__total {
  margin-left: auto;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.asset-item__unknown {
  color: var(--mx-color-text-disabled);
}
</style>
