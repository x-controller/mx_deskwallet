<script setup>
import MdChip from '@/themes/material/components/MdChip.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { TX_STATUS } from '@/composables/tx/useTxRow'

defineProps({
  /** pending | success | failed | dropped */
  status: { type: String, default: 'pending' },
  /** 悬停补充说明（手续费 / 区块 / 错误原因） */
  detail: { type: String, default: '' },
})

const TONE = { pending: 'neutral', success: 'success', failed: 'error', dropped: 'warning' }
</script>

<template>
  <MdTooltip :content="detail">
    <MdChip :tone="TONE[status] || 'neutral'">
      <template v-if="status === 'pending'" #icon><MdProgress :size="12" /></template>
      {{ (TX_STATUS[status] || TX_STATUS.pending).text }}
    </MdChip>
  </MdTooltip>
</template>
