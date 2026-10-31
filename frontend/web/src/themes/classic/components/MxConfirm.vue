<script setup>
import { confirmState, settleConfirm } from '@/utils/confirm'
import MxDialog from './MxDialog.vue'
import MxButton from './MxButton.vue'
</script>

<template>
  <MxDialog :model-value="confirmState.visible" :title="confirmState.title" width="380px" @update:model-value="settleConfirm(false)">
    <p class="mx-confirm__content">{{ confirmState.content }}</p>
    <template #footer>
      <MxButton size="sm" @click="settleConfirm(false)">取消</MxButton>
      <MxButton size="sm" :type="confirmState.danger ? 'danger' : 'primary'" @click="settleConfirm(true)">
        {{ confirmState.confirmText }}
      </MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.mx-confirm__content {
  margin: 0;
  line-height: 1.6;
  color: var(--mx-color-text);
  white-space: pre-line;
}
</style>
