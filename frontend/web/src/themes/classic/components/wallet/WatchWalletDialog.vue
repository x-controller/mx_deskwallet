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

const { text, groupId, loading, groupOptions, lines, valid, invalidCount, submit } = useBatchImport(props, emit, 'address')
</script>

<template>
  <MxDialog :model-value="modelValue" title="添加观察钱包" width="520px" @update:model-value="emit('update:modelValue', $event)">
    <div class="watch-form">
      <MxInput v-model="text" :rows="8" placeholder="每行一个地址（0x 或 T 开头），也可用空格 / 逗号分隔" autofocus />
      <p class="watch-form__hint" :class="{ 'is-error': invalidCount }">
        <template v-if="!lines.length">观察钱包只保存地址：能查余额、当收款方，不能转账 / 兑换 / 签名；之后导入对应私钥会自动升级为普通钱包</template>
        <template v-else>识别到 {{ valid.length }} 个地址<template v-if="invalidCount">，{{ invalidCount }} 条格式无效将被忽略</template></template>
      </p>
      <label class="watch-form__row">
        <span class="watch-form__label">添加到分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="watch-form__select" />
      </label>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :disabled="!valid.length" :loading="loading" @click="submit">
        添加{{ valid.length ? ` ${valid.length} 个` : '' }}
      </MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.watch-form {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.watch-form__hint {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.watch-form__hint.is-error {
  color: var(--mx-color-danger);
}

.watch-form__row {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
}

.watch-form__label {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.watch-form__select {
  width: 160px;
}
</style>
