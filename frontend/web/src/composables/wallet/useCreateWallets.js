import { ref, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { validate, rules } from '@/utils/validate'
import { message } from '@/utils/message'
import { useGroupOptions } from './useBatchImport'

export const MAX_CREATE_COUNT = 200

/** 创建钱包：数量校验与分组。props 需要 modelValue、defaultGroupId */
export function useCreateWallets(props, emit) {
  const walletStore = useWalletStore()
  const count = ref('1')
  const groupId = ref(DEFAULT_GROUP_ID)
  const errors = ref({})
  const loading = ref(false)
  const groupOptions = useGroupOptions(walletStore)

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
    errors.value = validate({ count: count.value }, { count: [rules.required('请输入数量'), rules.positiveInt(), rules.range(1, MAX_CREATE_COUNT)] })
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

  return { count, groupId, errors, loading, groupOptions, submit }
}
