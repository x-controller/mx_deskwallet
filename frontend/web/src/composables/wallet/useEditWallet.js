import { computed, ref, watch } from 'vue'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { validate, rules } from '@/utils/validate'
import { copyText } from '@/utils/storage'
import { message } from '@/utils/message'
import { useGroupOptions } from './useBatchImport'

/** 编辑钱包：名称 / 分组、私钥显示与复制。props 需要 modelValue、wallet */
export function useEditWallet(props, emit) {
  const walletStore = useWalletStore()
  const name = ref('')
  const groupId = ref('')
  const showKey = ref(false)
  const errors = ref({})
  const loading = ref(false)

  const groupOptions = useGroupOptions(walletStore)
  const watchOnly = computed(() => isWatchWallet(props.wallet))
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

  return { name, groupId, showKey, errors, loading, groupOptions, watchOnly, maskedKey, copyKey, submit }
}
