<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { useBatchImport } from '@/composables/wallet/useBatchImport'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 打开时默认选中的分组 */
  defaultGroupId: { type: String, default: DEFAULT_GROUP_ID },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { text, groupId, loading, groupOptions, lines, valid, invalidCount, submit } = useBatchImport(props, emit, 'address')
</script>

<template>
  <MdDialog :model-value="modelValue" title="添加观察钱包" icon="visibility" width="560px" @update:model-value="emit('update:modelValue', $event)">
    <div class="form">
      <p class="form__hint md-body-small">观察钱包只保存地址：能查余额、当收款方，不能转账 / 兑换 / 签名；之后导入对应私钥会自动升级为普通钱包。</p>
      <MdTextField
        v-model="text"
        :rows="7"
        label="地址"
        placeholder="每行一个地址，也可用空格 / 逗号分隔"
        :supporting-text="lines.length ? `识别到 ${valid.length} 个地址` : ''"
        :error="invalidCount ? `识别到 ${valid.length} 个地址，${invalidCount} 条格式无效将被忽略` : ''"
        autofocus
        mono
      />
      <MdSelect v-model="groupId" dense label="添加到分组" :options="groupOptions" />
    </div>
    <template #footer>
      <MdButton variant="text" @click="emit('update:modelValue', false)">取消</MdButton>
      <MdButton :disabled="!valid.length" :loading="loading" @click="submit">添加{{ valid.length ? ` ${valid.length} 个` : '' }}</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
}

.form__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}
</style>
