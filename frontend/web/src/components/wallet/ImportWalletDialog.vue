<script setup>
import { computed, ref, watch } from 'vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { isPrivateKey } from '@/utils/validate'
import { message } from '@/utils/message'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 打开时默认选中的分组 */
  defaultGroupId: { type: String, default: DEFAULT_GROUP_ID },
})

const emit = defineEmits(['update:modelValue', 'done'])

const walletStore = useWalletStore()
const text = ref('')
const groupId = ref(DEFAULT_GROUP_ID)
const loading = ref(false)

const groupOptions = computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))
const lines = computed(() => text.value.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))
const validKeys = computed(() => lines.value.filter(isPrivateKey))
const invalidCount = computed(() => lines.value.length - validKeys.value.length)

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    text.value = ''
    groupId.value = walletStore.groups.some((g) => g.id === props.defaultGroupId) ? props.defaultGroupId : DEFAULT_GROUP_ID
  },
)

async function submit() {
  if (!validKeys.value.length) return
  loading.value = true
  try {
    const { added, upgraded, skipped } = await walletStore.importPrivateKeys(validKeys.value, groupId.value)
    const parts = [`已导入 ${added} 个钱包`]
    if (upgraded) parts.push(`${upgraded} 个观察钱包已补上私钥`)
    if (skipped) parts.push(`跳过 ${skipped} 个重复`)
    message.success(parts.join('，'))
    emit('update:modelValue', false)
    emit('done')
  } catch (e) {
    message.error(e.message || '导入失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MxDialog :model-value="modelValue" title="导入私钥" width="520px" @update:model-value="emit('update:modelValue', $event)">
    <div class="import-form">
      <MxInput v-model="text" :rows="8" placeholder="每行一个私钥，支持带或不带 0x 前缀；也可用空格 / 逗号分隔" autofocus />
      <p class="import-form__hint" :class="{ 'is-error': invalidCount }">
        <template v-if="!lines.length">粘贴私钥后会自动识别</template>
        <template v-else>识别到 {{ validKeys.length }} 个私钥<template v-if="invalidCount">，{{ invalidCount }} 条格式无效将被忽略</template></template>
      </p>
      <label class="import-form__row">
        <span class="import-form__label">导入到分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="import-form__select" />
      </label>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :disabled="!validKeys.length" :loading="loading" @click="submit">
        导入{{ validKeys.length ? ` ${validKeys.length} 个` : '' }}
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
