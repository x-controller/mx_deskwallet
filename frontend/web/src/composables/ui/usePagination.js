import { computed } from 'vue'

/** 分页计算：总页数、每页条数选项、翻页与改页大小。props 需要 page、pageSize、total、pageSizes */
export function usePagination(props, emit) {
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

  return { pages, sizeOptions, go, changeSize }
}
