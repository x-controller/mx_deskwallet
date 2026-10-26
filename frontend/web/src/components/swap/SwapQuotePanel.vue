<script setup>
import { computed } from 'vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import { formatAmount, shortAddress } from '@/utils/format'
import { feeTierLabel } from '@/utils/dex'

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

const PRICE_IMPACT_WARN = 3

/** 路径文案：V3 在两跳之间标出池子手续费档位，如 WETH →0.3%→ USDC */
const pathText = computed(() => {
  const names = (props.quote.path ?? []).map((a) => props.symbols[a.toLowerCase()] || shortAddress(a))
  const fees = props.quote.fees ?? []
  return names.map((n, i) => (i < names.length - 1 ? `${n} →${fees[i] !== undefined ? feeTierLabel(fees[i]) : ''}→ ` : n)).join('')
})
const impactText = computed(() => (props.quote.priceImpact === null || props.quote.priceImpact === undefined ? '—' : `${props.quote.priceImpact.toFixed(2)}%`))
const impactHigh = computed(() => (props.quote.priceImpact ?? 0) >= PRICE_IMPACT_WARN)
</script>

<template>
  <div class="quote">
    <template v-if="quote.loading">
      <MxSkeleton width="60%" />
      <MxSkeleton width="40%" />
    </template>
    <p v-else-if="quote.error" class="quote__line is-error">{{ quote.error }}</p>
    <template v-else-if="quote.amountOut !== null && toAsset">
      <p class="quote__line">
        <span class="quote__label">预计到手</span>
        <span class="quote__value">{{ formatAmount(quote.amountOut, toAsset.decimals, 6) }} {{ toAsset.symbol }}</span>
      </p>
      <p class="quote__line">
        <span class="quote__label">最少到手</span>
        <span>{{ formatAmount(quote.amountOutMin, toAsset.decimals, 6) }} {{ toAsset.symbol }}</span>
      </p>
      <p class="quote__line">
        <span class="quote__label">价格影响</span>
        <span :class="{ 'is-error': impactHigh }">{{ impactText }}{{ impactHigh ? ' · 流动性不足，谨慎' : '' }}</span>
      </p>
      <p class="quote__line">
        <span class="quote__label">路径</span>
        <span class="quote__path">{{ pathText }}</span>
      </p>
    </template>
    <p v-else class="quote__line quote__idle">{{ idleText }}</p>
  </div>
</template>

<style scoped>
.quote {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.quote__line {
  display: flex;
  gap: var(--mx-space-sm);
  margin: 0;
  line-height: 1.5;
}

.quote__label {
  width: 56px;
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
}

.quote__value {
  font-weight: 600;
}

.quote__path {
  word-break: break-all;
}

.quote__idle {
  color: var(--mx-color-text-secondary);
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
