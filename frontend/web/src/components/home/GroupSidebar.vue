<script setup>
import { computed, ref } from 'vue'
import { RiAddLine, RiCheckLine, RiCloseLine, RiDeleteBinLine, RiPencilLine } from '@remixicon/vue'
import MxButton from '@/components/MxButton.vue'
import MxInput from '@/components/MxInput.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { useWalletStore } from '@/stores/wallet'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

const props = defineProps({
  /** 当前选中的分组 id，'all' 表示全部 */
  modelValue: { type: String, default: 'all' },
})

const emit = defineEmits(['update:modelValue'])

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
</script>

<template>
  <aside class="group-sidebar">
    <div class="group-sidebar__list">
      <button class="group-item" :class="{ 'is-active': modelValue === 'all' }" @click="emit('update:modelValue', 'all')">
        <span class="group-item__name">全部</span>
        <span class="group-item__count">{{ walletStore.wallets.length }}</span>
      </button>

      <template v-for="g in walletStore.groups" :key="g.id">
        <div v-if="editingId === g.id" class="group-edit">
          <MxInput v-model="draft" size="sm" :maxlength="20" autofocus @enter="commitEdit" @keydown.esc="cancelEdit" />
          <MxButton icon size="sm" aria-label="保存" @click="commitEdit"><RiCheckLine size="14" /></MxButton>
          <MxButton icon size="sm" aria-label="取消" @click="cancelEdit"><RiCloseLine size="14" /></MxButton>
        </div>
        <button v-else class="group-item" :class="{ 'is-active': modelValue === g.id }" @click="emit('update:modelValue', g.id)">
          <span class="group-item__name">{{ g.name }}</span>
          <span class="group-item__count">{{ counts[g.id] || 0 }}</span>
          <span class="group-item__actions" @click.stop>
            <MxTooltip content="重命名">
              <MxButton icon size="xs" type="surface" aria-label="重命名" @click="startEdit(g.id, g.name)"><RiPencilLine size="13" /></MxButton>
            </MxTooltip>
            <MxTooltip v-if="g.id !== DEFAULT_GROUP_ID" content="删除分组">
              <MxButton icon size="xs" type="surface" aria-label="删除分组" @click="remove(g)"><RiDeleteBinLine size="13" /></MxButton>
            </MxTooltip>
          </span>
        </button>
      </template>

      <div v-if="editingId === 'new'" class="group-edit">
        <MxInput v-model="draft" size="sm" placeholder="分组名" :maxlength="20" autofocus @enter="commitEdit" @keydown.esc="cancelEdit" />
        <MxButton icon size="sm" aria-label="保存" @click="commitEdit"><RiCheckLine size="14" /></MxButton>
        <MxButton icon size="sm" aria-label="取消" @click="cancelEdit"><RiCloseLine size="14" /></MxButton>
      </div>
    </div>

    <MxButton v-if="editingId !== 'new'" size="sm" block @click="startEdit('new')">
      <RiAddLine size="14" />
      新建分组
    </MxButton>
  </aside>
</template>

<style scoped>
.group-sidebar {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
  width: 168px;
  flex-shrink: 0;
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
}

.group-sidebar__list {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.group-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  width: 100%;
  height: var(--mx-size-sm);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border: none;
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  text-align: left;
  cursor: pointer;
  transition: background var(--mx-transition);
}

.group-item:hover {
  background: var(--mx-color-bg-hover);
}

.group-item.is-active {
  background: var(--mx-color-bg-active);
}

.group-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.group-item__count {
  font-size: var(--mx-font-xs);
  color: var(--mx-color-text-secondary);
}

.group-item__actions {
  position: absolute;
  right: var(--mx-space-xxs);
  top: 50%;
  display: none;
  gap: var(--mx-space-xxs);
  transform: translateY(-50%);
}

@media (hover: hover) {
  .group-item:hover .group-item__actions {
    display: inline-flex;
  }

  .group-item:hover .group-item__count {
    visibility: hidden;
  }
}

.group-edit {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xxs);
  margin-bottom: var(--mx-space-xxs);
}

.group-edit :deep(.mx-input-wrap) {
  flex: 1;
}
</style>
