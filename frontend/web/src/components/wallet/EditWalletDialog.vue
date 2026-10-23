<script setup>
import { computed, ref, watch } from 'vue'
import { RiEyeLine, RiEyeOffLine, RiFileCopyLine } from '@remixicon/vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import MxAddress from '@/components/MxAddress.vue'
import { useWalletStore } from '@/stores/wallet'
import { validate, rules } from '@/utils/validate'
import { copyText } from '@/utils/storage'
import { message } from '@/utils/message'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 正在编辑的钱包对象 */
  wallet: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue'])

const walletStore = useWalletStore()
const name = ref('')
const groupId = ref('')
const showKey = ref(false)
const errors = ref({})
const loading = ref(false)

const groupOptions = computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))
const maskedKey = computed(() => (showKey.value ? props.wallet?.privateKey : '•'.repeat(66)))

watch(
  () => props.modelValue,
  (v) => {
    if (!v || !props.wallet) return
    name.value = props.wallet.name
    groupId.value = props.wallet.groupId
    showKey.value = false
    errors.value = {}
  },
)

async function copyKey() {
  await copyText(props.wallet.privateKey)
  message.success('私钥已复制，请妥善保管')
}

async function submit() {
  errors.value = validate({ name: name.value }, { name: [rules.required('请输入名称')] })
  if (Object.keys(errors.value).length) return
  loading.value = true
  try {
    await walletStore.updateWallet(props.wallet.id, { name: name.value.trim(), groupId: groupId.value })
    message.success('已保存')
    emit('update:modelValue', false)
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MxDialog :model-value="modelValue" title="编辑钱包" width="520px" @update:model-value="emit('update:modelValue', $event)">
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
      <div class="edit-form__row">
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

.edit-form__key-text {
  flex: 1;
  min-width: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  word-break: break-all;
}
</style>
