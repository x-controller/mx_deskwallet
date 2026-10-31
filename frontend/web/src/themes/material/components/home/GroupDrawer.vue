<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdNavItem from '@/themes/material/components/MdNavItem.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { DEFAULT_GROUP_ID } from '@/stores/vault'
import { useGroupSidebar } from '@/composables/home/useGroupSidebar'

const props = defineProps({
  /** 当前选中的分组 id，'all' 表示全部 */
  modelValue: { type: String, default: 'all' },
})

const emit = defineEmits(['update:modelValue'])

const { walletStore, counts, editingId, draft, startEdit, cancelEdit, commitEdit, remove } = useGroupSidebar(props, emit)
</script>

<template>
  <aside class="drawer">
    <p class="drawer__headline md-title-small">分组</p>
    <div class="drawer__list">
      <MdNavItem dense :active="modelValue === 'all'" @click="emit('update:modelValue', 'all')">
        <template #icon><MdIcon name="wallet" :size="20" /></template>
        全部
        <template #trailing><span class="drawer__count">{{ walletStore.wallets.length }}</span></template>
      </MdNavItem>

      <template v-for="g in walletStore.groups" :key="g.id">
        <div v-if="editingId === g.id" class="drawer__edit">
          <MdTextField v-model="draft" dense label="分组名" :maxlength="20" autofocus @enter="commitEdit" @keydown.esc="cancelEdit" />
          <MdIconButton size="sm" aria-label="保存" @click="commitEdit"><MdIcon name="check" /></MdIconButton>
          <MdIconButton size="sm" aria-label="取消" @click="cancelEdit"><MdIcon name="close" /></MdIconButton>
        </div>
        <MdNavItem v-else dense :active="modelValue === g.id" class="drawer__item" @click="emit('update:modelValue', g.id)">
          <template #icon><MdIcon name="folder" :size="20" /></template>
          {{ g.name }}
          <template #trailing>
            <span class="drawer__count">{{ counts[g.id] || 0 }}</span>
            <span class="drawer__actions">
              <MdTooltip content="重命名">
                <MdIconButton size="xs" aria-label="重命名" @click="startEdit(g.id, g.name)"><MdIcon name="edit" /></MdIconButton>
              </MdTooltip>
              <MdTooltip v-if="g.id !== DEFAULT_GROUP_ID" content="删除分组">
                <MdIconButton size="xs" aria-label="删除分组" @click="remove(g)"><MdIcon name="delete" /></MdIconButton>
              </MdTooltip>
            </span>
          </template>
        </MdNavItem>
      </template>

      <div v-if="editingId === 'new'" class="drawer__edit">
        <MdTextField v-model="draft" dense label="新分组名" :maxlength="20" autofocus @enter="commitEdit" @keydown.esc="cancelEdit" />
        <MdIconButton size="sm" aria-label="保存" @click="commitEdit"><MdIcon name="check" /></MdIconButton>
        <MdIconButton size="sm" aria-label="取消" @click="cancelEdit"><MdIcon name="close" /></MdIconButton>
      </div>
    </div>

    <MdButton v-if="editingId !== 'new'" variant="tonal" block class="drawer__add" @click="startEdit('new')">
      <template #icon><MdIcon name="add" /></template>
      新建分组
    </MdButton>
  </aside>
</template>

<style scoped>
.drawer {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  width: 224px;
  flex-shrink: 0;
  padding: var(--md-space-3);
  background: var(--md-sys-color-surface-container-low);
  border-radius: var(--md-sys-shape-corner-large);
}

.drawer__headline {
  margin: 0;
  padding: var(--md-space-2) var(--md-space-4) 0;
  color: var(--md-sys-color-on-surface-variant);
}

.drawer__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.drawer__count {
  color: var(--md-sys-color-on-surface-variant);
}

.drawer__actions {
  display: none;
  align-items: center;
}

@media (hover: hover) {
  .drawer__item:hover .drawer__actions {
    display: inline-flex;
  }

  .drawer__item:hover .drawer__count {
    display: none;
  }
}

.drawer__edit {
  display: flex;
  align-items: center;
  gap: 2px;
  padding: 2px 0;
}

.drawer__edit :deep(.md-field) {
  flex: 1;
  min-width: 0;
}

.drawer__add {
  flex-shrink: 0;
}
</style>
