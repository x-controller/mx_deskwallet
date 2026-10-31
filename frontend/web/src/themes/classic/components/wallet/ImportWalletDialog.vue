<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { useBatchImport } from '@/composables/wallet/useBatchImport'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 打开时默认选中的分组 */
  defaultGroupId: { type: String, default: DEFAULT_GROUP_ID },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { text, groupId, loading, groupOptions, lines, valid, invalidCount, submit } = useBatchImport(props, emit, 'key')
</script>

<template>
  <MxDialog :model-value="modelValue" title="导入私钥" width="520px" @update:model-value="emit('update:modelValue', $event)">
    <div class="import-form">
      <MxInput v-model="text" :rows="8" placeholder="每行一个私钥，支持带或不带 0x 前缀；也可用空格 / 逗号分隔" autofocus />
      <p class="import-form__hint" :class="{ 'is-error': invalidCount }">
        <template v-if="!lines.length">粘贴私钥后会自动识别</template>
        <template v-else>识别到 {{ valid.length }} 个私钥<template v-if="invalidCount">，{{ invalidCount }} 条格式无效将被忽略</template></template>
      </p>
      <label class="import-form__row">
        <span class="import-form__label">导入到分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="import-form__select" />
      </label>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :disabled="!valid.length" :loading="loading" @click="submit">
        导入{{ valid.length ? ` ${valid.length} 个` : '' }}
      </MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.import-form {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.import-form__hint {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.import-form__hint.is-error {
  color: var(--mx-color-danger);
}

.import-form__row {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
}

.import-form__label {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.import-form__select {
  width: 160px;
}
</style>
