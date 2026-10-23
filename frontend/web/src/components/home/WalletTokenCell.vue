<script setup>
import { computed } from 'vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import MxTag from '@/components/MxTag.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { formatAmount } from '@/utils/format'

const props = defineProps({
  /** 钱包在当前网络的余额缓存对象（见 wallet store） */
  balance: { type: Object, default: null },
  /** 当前网络配置的 Token 列表 */
  tokens: { type: Array, default: () => [] },
})

const rows = computed(() =>
  props.tokens.map((t) => {
    const raw = props.balance?.tokens?.[t.address.toLowerCase()]
    return {
      symbol: t.symbol,
      raw: raw === undefined ? null : raw,
      text: raw === null || raw === undefined ? '查询失败' : formatAmount(raw, t.decimals, 4),
    }
  }),
)

const nonZero = computed(() => rows.value.filter((r) => r.raw !== null && r.raw > 0n))
const failed = computed(() => rows.value.some((r) => r.raw === null))
const loaded = computed(() => !!props.balance && !props.balance.loading && !props.balance.error)
const tooltip = computed(() => rows.value.map((r) => `${r.symbol} ${r.text}`).join('\n'))
</script>

<template>
  <span class="token-cell">
    <span v-if="!tokens.length" class="token-cell__muted">未配置</span>
    <MxSkeleton v-else-if="balance?.loading" width="90px" />
    <span v-else-if="!loaded" class="token-cell__muted">—</span>
    <MxTooltip v-else :content="tooltip" class="token-cell__chips">
      <template v-if="nonZero.length">
        <MxTag v-for="r in nonZero" :key="r.symbol" type="info">{{ r.symbol }} {{ r.text }}</MxTag>
      </template>
      <span v-else class="token-cell__muted" :class="{ 'is-error': failed }">{{ failed ? '部分查询失败' : '0' }}</span>
    </MxTooltip>
  </span>
</template>

<style scoped>
.token-cell {
  display: inline-flex;
  min-width: 0;
  overflow: hidden;
}

.token-cell__chips {
  gap: var(--mx-space-xxs);
  overflow: hidden;
  white-space: nowrap;
}

.token-cell__muted {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
