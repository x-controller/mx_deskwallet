<script setup>
import { computed, ref, watch } from 'vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { isEvmAddress } from '@/utils/validate'
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
const validAddresses = computed(() => lines.value.filter(isEvmAddress))
const invalidCount = computed(() => lines.value.length - validAddresses.value.length)

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    text.value = ''
    groupId.value = walletStore.groups.some((g) => g.id === props.defaultGroupId) ? props.defaultGroupId : DEFAULT_GROUP_ID
  },
)

async function submit() {
  if (!validAddresses.value.length) return
  loading.value = true
  try {
    const { added, skipped } = await walletStore.importWatchAddresses(validAddresses.value, groupId.value)
    message.success(skipped ? `已添加 ${added} 个观察钱包，跳过 ${skipped} 个已存在的地址` : `已添加 ${added} 个观察钱包`)
    emit('update:modelValue', false)
    emit('done')
  } catch (e) {
    message.error(e.message || '添加失败')
  } finally {
    loading.value = false
  }
}
</script>

<template>
  <MxDialog :model-value="modelValue" title="添加观察钱包" width="520px" @update:model-value="emit('update:modelValue', $event)">
    <div class="watch-form">
      <MxInput v-model="text" :rows="8" placeholder="每行一个地址，也可用空格 / 逗号分隔" autofocus />
      <p class="watch-form__hint" :class="{ 'is-error': invalidCount }">
        <template v-if="!lines.length">观察钱包只保存地址：能查余额、当收款方，不能转账 / 兑换 / 签名；之后导入对应私钥会自动升级为普通钱包</template>
        <template v-else>识别到 {{ validAddresses.length }} 个地址<template v-if="invalidCount">，{{ invalidCount }} 条格式无效将被忽略</template></template>
      </p>
      <label class="watch-form__row">
        <span class="watch-form__label">添加到分组</span>
        <MxSelect v-model="groupId" size="sm" :options="groupOptions" class="watch-form__select" />
      </label>
    </div>
    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :disabled="!validAddresses.length" :loading="loading" @click="submit">
        添加{{ validAddresses.length ? ` ${validAddresses.length} 个` : '' }}
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
