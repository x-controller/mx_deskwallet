<script setup>
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
import { useSwapQuote } from '@/composables/swap/useSwapQuote'

const props = defineProps({
  /** { loading, error, amountOut, amountOutMin, priceImpact, path, fees } */
  quote: { type: Object, required: true },
  fromAsset: { type: Object, default: null },
  toAsset: { type: Object, default: null },
  /** 地址小写 → 符号，用于显示路径 */
  symbols: { type: Object, default: () => ({}) },
  /** 没有可报价数量时的说明文案 */
  idleText: { type: String, default: '填写数量后显示报价' },
})

const { pathText, impactText, impactHigh, hasQuote, amountOutText, amountOutMinText } = useSwapQuote(props)
</script>

<template>
  <div class="quote">
    <template v-if="quote.loading">
      <MdSkeleton width="60%" />
      <MdSkeleton width="40%" />
    </template>
    <p v-else-if="quote.error" class="quote__line md-error-text md-body-small">{{ quote.error }}</p>
    <template v-else-if="hasQuote">
      <MdKeyValue label="预计到手"><span class="quote__value md-title-medium">{{ amountOutText }}</span></MdKeyValue>
      <MdKeyValue label="最少到手">{{ amountOutMinText }}</MdKeyValue>
      <MdKeyValue label="价格影响"><span :class="{ 'md-error-text': impactHigh }">{{ impactText }}{{ impactHigh ? ' · 流动性不足，谨慎' : '' }}</span></MdKeyValue>
      <MdKeyValue label="路径"><span class="quote__path md-body-small">{{ pathText }}</span></MdKeyValue>
    </template>
    <p v-else class="quote__line quote__idle md-body-small">{{ idleText }}</p>
  </div>
</template>

<style scoped>
.quote {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.quote__line {
  margin: 0;
}

.quote__value {
  color: var(--md-sys-color-primary);
}

.quote__path {
  word-break: break-all;
}

.quote__idle {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
