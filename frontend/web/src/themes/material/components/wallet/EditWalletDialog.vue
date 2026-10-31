<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
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
  <MdDialog :model-value="modelValue" :title="watchOnly ? '编辑观察钱包' : '编辑钱包'" width="560px" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="wallet" class="form">
      <MdTextField v-model="name" dense label="名称" :maxlength="30" :error="errors.name" autofocus @enter="submit" />
      <MdSelect v-model="groupId" dense label="分组" :options="groupOptions" />
      <MdKeyValue label="地址">
        <MdAddress :address="wallet.address" full />
      </MdKeyValue>
      <MdKeyValue v-if="watchOnly" label="私钥">
        <MdChip tone="tertiary">观察钱包</MdChip>
        <span class="md-body-small md-on-surface-variant">未保存私钥，只能查看余额；在「导入私钥」里导入该地址的私钥即可升级为普通钱包。</span>
      </MdKeyValue>
      <MdKeyValue v-else label="私钥">
        <span class="key md-mono md-body-small">{{ maskedKey }}</span>
        <span class="key__actions">
          <MdTooltip :content="showKey ? '隐藏' : '显示'">
            <MdIconButton size="sm" :aria-label="showKey ? '隐藏私钥' : '显示私钥'" @click="showKey = !showKey">
              <MdIcon :name="showKey ? 'visibility_off' : 'visibility'" />
            </MdIconButton>
          </MdTooltip>
          <MdTooltip content="复制私钥">
            <MdIconButton size="sm" aria-label="复制私钥" @click="copyKey"><MdIcon name="content_copy" /></MdIconButton>
          </MdTooltip>
        </span>
      </MdKeyValue>
    </div>
    <template #footer>
      <MdButton variant="text" @click="emit('update:modelValue', false)">取消</MdButton>
      <MdButton :loading="loading" @click="submit">保存</MdButton>
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

.key {
  flex: 1;
  min-width: 0;
  word-break: break-all;
}

.key__actions {
  display: inline-flex;
}
</style>
