<script setup>
import { computed, ref, watch } from 'vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { validate, rules } from '@/utils/validate'
import { message } from '@/utils/message'

const MAX_COUNT = 200

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  defaultGroupId: { type: String, default: DEFAULT_GROUP_ID },
})

const emit = defineEmits(['update:modelValue', 'done'])

const walletStore = useWalletStore()
const count = ref('1')
const groupId = ref(DEFAULT_GROUP_ID)
const errors = ref({})
const loading = ref(false)

const groupOptions = computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    count.value = '1'
    errors.value = {}
    groupId.value = walletStore.groups.some((g) => g.id === props.defaultGroupId) ? props.defaultGroupId : DEFAULT_GROUP_ID
  },
)

async function submit() {
  errors.value = validate({ count: count.value }, { count: [rules.required('请输入数量'), rules.positiveInt(), rules.range(1, MAX_COUNT)] })
  if (Object.keys(errors.value).length) return
  loading.value = true
  try {
    const created = await walletStore.createWallets(Number(count.value), groupId.value)
    message.success(`已创建 ${created.length} 个钱包`)
    emit('update:modelValue', false)
    emit('done')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MxDialog :model-value="modelValue" title="创建钱包" width="400px" @update:model-value="emit('update:modelValue', $event)">
    <div class="create-form">
      <label class="create-form__row">
        <span class="create-form__label">数量</span>
        <MxInput v-model="count" size="sm" type="number" :error="errors.count" class="create-form__field" autofocus @enter="submit" />
      </label>
      <label class="create-form__row">
        <span class="create-form__label">分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="create-form__field" />
      </label>
      <p class="create-form__hint">随机生成私钥并加密保存在本机，请及时在「编辑」中备份。</p>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :loading="loading" @click="submit">创建</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.create-form {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.create-form__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
}

.create-form__label {
  width: 48px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.create-form__field {
  flex: 1;
}

.create-form__hint {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
