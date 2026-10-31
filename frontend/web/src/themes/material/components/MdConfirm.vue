<script setup>
import MdDialog from './MdDialog.vue'
import MdButton from './MdButton.vue'
import { confirmState, settleConfirm } from '@/utils/confirm'
</script>

<template>
  <MdDialog :model-value="confirmState.visible" :title="confirmState.title" :icon="confirmState.danger ? 'warning' : ''" width="400px" :closable="false">
    <p class="md-confirm__content">{{ confirmState.content }}</p>
    <template #footer>
      <MdButton variant="text" @click="settleConfirm(false)">取消</MdButton>
      <MdButton variant="text" :color="confirmState.danger ? 'error' : 'primary'" @click="settleConfirm(true)">{{ confirmState.confirmText }}</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.md-confirm__content {
  margin: 0;
  white-space: pre-line;
  word-break: break-all;
}
</style>
