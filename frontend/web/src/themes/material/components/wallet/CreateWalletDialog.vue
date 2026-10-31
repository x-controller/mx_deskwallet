<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { useCreateWallets, MAX_CREATE_COUNT } from '@/composables/wallet/useCreateWallets'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultGroupId: { type: String, default: DEFAULT_GROUP_ID },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { count, groupId, errors, loading, groupOptions, submit } = useCreateWallets(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" title="创建钱包" icon="add_circle" width="420px" @update:model-value="emit('update:modelValue', $event)">
    <div class="form">
      <MdTextField v-model="count" dense type="number" label="数量" :supporting-text="`1 ~ ${MAX_CREATE_COUNT}`" :error="errors.count" autofocus @enter="submit" />
      <MdSelect v-model="groupId" dense label="分组" :options="groupOptions" />
      <p class="form__hint md-body-small">随机生成私钥并加密保存在本机，请及时在「编辑」中备份。</p>
    </div>
    <template #footer>
      <MdButton variant="text" @click="emit('update:modelValue', false)">取消</MdButton>
      <MdButton :loading="loading" @click="submit">创建</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  padding-top: var(--md-space-1);
}

.form__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
