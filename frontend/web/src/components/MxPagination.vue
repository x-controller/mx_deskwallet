<script setup>
import { computed } from 'vue'
import { RiArrowLeftSLine, RiArrowRightSLine } from '@remixicon/vue'
import MxButton from './MxButton.vue'
import MxSelect from './MxSelect.vue'
import MxTooltip from './MxTooltip.vue'

const props = defineProps({
  /** 当前页，从 1 开始 */
  page: { type: Number, default: 1 },
  pageSize: { type: Number, default: 20 },
  total: { type: Number, default: 0 },
  pageSizes: { type: Array, default: () => [20, 50, 100] },
})

const emit = defineEmits(['update:page', 'update:pageSize'])

const pages = computed(() => Math.max(1, Math.ceil(props.total / props.pageSize)))
const sizeOptions = computed(() => props.pageSizes.map((n) => ({ label: `${n} 条 / 页`, value: n })))

function go(p) {
  const next = Math.min(Math.max(1, p), pages.value)
  if (next !== props.page) emit('update:page', next)
}

function changeSize(size) {
  emit('update:pageSize', size)
  emit('update:page', 1)
}
</script>

<template>
  <nav class="mx-pagination" aria-label="分页">
    <span class="mx-pagination__total">共 {{ total }} 条</span>
    <MxSelect class="mx-pagination__size" size="sm" :model-value="pageSize" :options="sizeOptions" @update:model-value="changeSize" />
    <MxTooltip content="上一页">
      <MxButton icon size="sm" aria-label="上一页" :disabled="page <= 1" @click="go(page - 1)"><RiArrowLeftSLine size="16" /></MxButton>
    </MxTooltip>
    <span class="mx-pagination__current">{{ page }} / {{ pages }}</span>
    <MxTooltip content="下一页">
      <MxButton icon size="sm" aria-label="下一页" :disabled="page >= pages" @click="go(page + 1)"><RiArrowRightSLine size="16" /></MxButton>
    </MxTooltip>
  </nav>
</template>

<style scoped>
.mx-pagination {
  display: flex;
  align-items: center;
  justify-content: flex-end;
  gap: var(--mx-space-xs);
  height: var(--mx-size-md);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.mx-pagination__total {
  margin-right: auto;
}

.mx-pagination__size {
  width: 112px;
}

.mx-pagination__current {
  min-width: 56px;
  text-align: center;
  color: var(--mx-color-text);
}
</style>
