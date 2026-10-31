import { computed, ref } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

/** 分组栏：各组钱包数、新建 / 重命名 / 删除。props 需要 modelValue（当前分组 id，'all' 为全部） */
export function useGroupSidebar(props, emit) {
  const walletStore = useWalletStore()

  const counts = computed(() => {
    const map = {}
    walletStore.wallets.forEach((w) => {
      map[w.groupId] = (map[w.groupId] || 0) + 1
    })
    return map
  })

  /** 正在编辑的分组 id；'new' 表示新建输入框 */
  const editingId = ref('')
  const draft = ref('')

  function startEdit(id, name = '') {
    editingId.value = id
    draft.value = name
  }

  function cancelEdit() {
    editingId.value = ''
    draft.value = ''
  }

  async function commitEdit() {
    const name = draft.value.trim()
    if (!name) return cancelEdit()
    if (walletStore.groups.some((g) => g.name === name && g.id !== editingId.value)) {
      message.error('分组名已存在')
      return
    }
    if (editingId.value === 'new') {
      const g = await walletStore.addGroup(name)
      emit('update:modelValue', g.id)
    } else {
      await walletStore.renameGroup(editingId.value, name)
    }
    cancelEdit()
  }

  async function remove(group) {
    const n = counts.value[group.id] || 0
    const ok = await confirm({
      title: '删除分组',
      content: n ? `分组「${group.name}」内的 ${n} 个钱包将移入默认分组。` : `确定删除分组「${group.name}」？`,
      confirmText: '删除',
    })
    if (!ok) return
    await walletStore.removeGroup(group.id)
    if (props.modelValue === group.id) emit('update:modelValue', 'all')
  }

  return { walletStore, counts, editingId, draft, startEdit, cancelEdit, commitEdit, remove }
}
