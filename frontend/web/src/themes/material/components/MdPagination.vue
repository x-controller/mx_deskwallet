<script setup>
import MdIcon from './MdIcon.vue'
import MdIconButton from './MdIconButton.vue'
import MdSelect from './MdSelect.vue'
import MdTooltip from './MdTooltip.vue'
import { usePagination } from '@/composables/ui/usePagination'

const props = defineProps({
  /** 当前页，从 1 开始 */
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [20, 50, 100] },
})

const emit = defineEmits(['update:page', 'update:pageSize'])

const { pages, sizeOptions, go, changeSize } = usePagination(props, emit)
</script>

<template>
  <nav class="md-pagination" aria-label="分页">
    <span class="md-pagination__total">共 {{ total }} 条</span>
    <MdSelect class="md-pagination__size" dense :model-value="pageSize" :options="sizeOptions" @update:model-value="changeSize" />
    <MdTooltip content="上一页">
      <MdIconButton size="sm" aria-label="上一页" :disabled="page <= 1" @click="go(page - 1)"><MdIcon name="chevron_left" /></MdIconButton>
    </MdTooltip>
    <span class="md-pagination__current">{{ page }} / {{ pages }}</span>
    <MdTooltip content="下一页">
      <MdIconButton size="sm" aria-label="下一页" :disabled="page >= pages" @click="go(page + 1)"><MdIcon name="chevron_right" /></MdIconButton>
    </MdTooltip>
  </nav>
</template>

<style scoped>
.md-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--md-space-2);
  padding: var(--md-space-2) var(--md-space-2) 0;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
}

.md-pagination__total {
  margin-right: auto;
}

.md-pagination__size {
  width: 130px;
}

.md-pagination__current {
  min-width: 56px;
  text-align: center;
  color: var(--md-sys-color-on-surface);
}
</style>
