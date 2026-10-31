<script setup>
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine } from '@remixicon/vue'
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import { useEditWallet } from '@/composables/wallet/useEditWallet'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 正在编辑的钱包对象 */
  wallet: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const { name, groupId, showKey, errors, loading, groupOptions, watchOnly, maskedKey, copyKey, submit } = useEditWallet(props, emit)
</script>

<template>
  <MxDialog :model-value="modelValue" :title="watchOnly ? '编辑观察钱包' : '编辑钱包'" width="520px" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="wallet" class="edit-form">
      <label class="edit-form__row">
        <span class="edit-form__label">名称</span>
        <MxInput v-model="name" size="sm" :maxlength="30" :error="errors.name" class="edit-form__field" autofocus @enter="submit" />
      </label>
      <label class="edit-form__row">
        <span class="edit-form__label">分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="edit-form__field" />
      </label>
      <div class="edit-form__row">
        <span class="edit-form__label">地址</span>
        <MxAddress :address="wallet.address" full button-type="default" class="edit-form__field" />
      </div>
      <div v-if="watchOnly" class="edit-form__row">
        <span class="edit-form__label">私钥</span>
        <div class="edit-form__field edit-form__watch">
          <MxTag type="info">观察钱包</MxTag>
          <span class="edit-form__watch-text">未保存私钥，只能查看余额；在「导入私钥」里导入该地址的私钥即可升级为普通钱包。</span>
        </div>
      </div>
      <div v-else class="edit-form__row">
        <span class="edit-form__label">私钥</span>
        <div class="edit-form__key">
          <span class="edit-form__key-text">{{ maskedKey }}</span>
          <MxTooltip :content="showKey ? '隐藏' : '显示'">
            <MxButton icon size="xs" :aria-label="showKey ? '隐藏私钥' : '显示私钥'" @click="showKey = !showKey">
              <RiEyeOffLine v-if="showKey" size="14" />
              <RiEyeLine v-else size="14" />
            </MxButton>
          </MxTooltip>
          <MxTooltip content="复制私钥">
            <MxButton icon size="xs" aria-label="复制私钥" @click="copyKey"><RiFileCopyLine size="14" /></MxButton>
          </MxTooltip>
        </div>
      </div>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :loading="loading" @click="submit">保存</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.edit-form {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.edit-form__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.edit-form__label {
  width: 40px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.edit-form__field {
  flex: 1;
  min-width: 0;
  line-height: var(--mx-size-sm);
  word-break: break-all;
}

.edit-form__key {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
  flex: 1;
  min-width: 0;
}

.edit-form__watch {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
}

.edit-form__watch-text {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.edit-form__key-text {
  flex: 1;
  min-width: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  word-break: break-all;
}
</style>
