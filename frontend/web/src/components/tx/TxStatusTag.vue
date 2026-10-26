<script setup>
import MxTag from '@/components/MxTag.vue'
import MxSpinner from '@/components/MxSpinner.vue'
import MxTooltip from '@/components/MxTooltip.vue'

defineProps({
  /** pending | success | failed | dropped */
  status: { type: String, default: 'pending' },
  /** 悬停补充说明（手续费 / 区块 / 错误原因） */
  detail: { type: String, default: '' },
})

const STATUS = {
  pending: { type: 'default', text: '待确认' },
  success: { type: 'info', text: '成功' },
  failed: { type: 'danger', text: '失败' },
  dropped: { type: 'danger', text: '已丢弃' },
}
</script>

<template>
  <MxTooltip :content="detail">
    <MxTag :type="(STATUS[status] || STATUS.pending).type">
      <MxSpinner v-if="status === 'pending'" :size="10" />
      {{ (STATUS[status] || STATUS.pending).text }}
    </MxTag>
  </MxTooltip>
</template>
