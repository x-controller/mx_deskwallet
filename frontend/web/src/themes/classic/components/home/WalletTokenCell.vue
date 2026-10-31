<script setup>
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import { useTokenCell } from '@/composables/home/useTokenCell'

const props = defineProps({
  /** 钱包在当前网络的余额缓存对象（见 wallet store） */
  balance: { type: Object, default: null },
  /** 当前网络配置的 Token 列表 */
  tokens: { type: Array, default: () => [] },
})

const { nonZero, failed, loaded, tooltip } = useTokenCell(props)
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
