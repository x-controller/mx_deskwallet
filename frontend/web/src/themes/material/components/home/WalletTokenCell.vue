<script setup>
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
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
    <span v-if="!tokens.length" class="token-cell__muted md-body-small">未配置</span>
    <MdSkeleton v-else-if="balance?.loading" width="90px" />
    <span v-else-if="!loaded" class="token-cell__muted md-body-small">—</span>
    <MdTooltip v-else :content="tooltip" class="token-cell__chips">
      <template v-if="nonZero.length">
        <MdChip v-for="r in nonZero" :key="r.symbol" tone="secondary">{{ r.symbol }} {{ r.text }}</MdChip>
      </template>
      <span v-else class="token-cell__muted md-body-small" :class="{ 'md-error-text': failed }">{{ failed ? '部分查询失败' : '0' }}</span>
    </MdTooltip>
  </span>
</template>

<style scoped>
.token-cell {
  display: inline-flex;
  min-width: 0;
  overflow: hidden;
}

.token-cell__chips {
  gap: var(--md-space-1);
  overflow: hidden;
  white-space: nowrap;
}

.token-cell__muted {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
