import { computed, ref, watch } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { isPrivateKey, isEvmAddress } from '@/utils/validate'
import { message } from '@/utils/message'

/** 分组下拉选项（多个弹框共用） */
export function useGroupOptions(walletStore = useWalletStore()) {
  return computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))
}

/**
 * 批量粘贴导入（私钥 / 观察地址共用）：按空白 / 逗号 / 分号拆行，统计有效与无效条数，提交到分组。
 * props 需要 modelValue、defaultGroupId；kind 为 'key' 或 'address'
 */
export function useBatchImport(props, emit, kind) {
  const walletStore = useWalletStore()
  const text = ref('')
  const groupId = ref(DEFAULT_GROUP_ID)
  const loading = ref(false)

  const groupOptions = useGroupOptions(walletStore)
  const lines = computed(() => text.value.split(/[\s,;]+/).map((s) => s.trim()).filter(Boolean))
  const valid = computed(() => lines.value.filter(kind === 'key' ? isPrivateKey : isEvmAddress))
  const invalidCount = computed(() => lines.value.length - valid.value.length)

  watch(
    () => props.modelValue,
    (v) => {
      if (!v) return
      text.value = ''
      groupId.value = walletStore.groups.some((g) => g.id === props.defaultGroupId) ? props.defaultGroupId : DEFAULT_GROUP_ID
    },
  )

  async function submit() {
    if (!valid.value.length) return
    loading.value = true
    try {
      if (kind === 'key') {
        const { added, upgraded, skipped } = await walletStore.importPrivateKeys(valid.value, groupId.value)
        const parts = [`已导入 ${added} 个钱包`]
        if (upgraded) parts.push(`${upgraded} 个观察钱包已补上私钥`)
        if (skipped) parts.push(`跳过 ${skipped} 个重复`)
        message.success(parts.join('，'))
      } else {
        const { added, skipped } = await walletStore.importWatchAddresses(valid.value, groupId.value)
        message.success(skipped ? `已添加 ${added} 个观察钱包，跳过 ${skipped} 个已存在的地址` : `已添加 ${added} 个观察钱包`)
      }
      emit('update:modelValue', false)
      emit('done')
    } catch (e) {
      message.error(e.message || (kind === 'key' ? '导入失败' : '添加失败'))
    } finally {
      loading.value = false
    }
  }

  return { text, groupId, loading, groupOptions, lines, valid, invalidCount, submit }
}
