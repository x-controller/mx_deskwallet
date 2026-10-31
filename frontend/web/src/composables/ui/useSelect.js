import { computed, nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * 下拉选择的全部交互逻辑：开合、浮层定位（固定定位，放不下自动翻到上方）、
 * 键盘导航、外部点击 / 滚动关闭。组件只负责渲染。
 * props 需要 modelValue、options、disabled
 */
export function useSelect(props, emit, { gap = 4 } = {}) {
  const root = ref(null)
  const panel = ref(null)
  const open = ref(false)
  const hoverIndex = ref(-1)
  const panelStyle = ref({})

  const selected = computed(() => props.options.find((o) => o.value === props.modelValue))

  function place() {
    if (!root.value || !panel.value) return
    const r = root.value.getBoundingClientRect()
    const h = panel.value.offsetHeight
    const below = window.innerHeight - r.bottom
    const top = below < h + gap && r.top > below ? r.top - h - gap : r.bottom + gap
    panelStyle.value = { top: `${top}px`, left: `${r.left}px`, minWidth: `${r.width}px` }
  }

  async function show() {
    if (props.disabled) return
    open.value = true
    hoverIndex.value = props.options.findIndex((o) => o.value === props.modelValue)
    await nextTick()
    place()
  }

  function hide() {
    open.value = false
  }

  function toggle() {
    open.value ? hide() : show()
  }

  function choose(opt) {
    if (opt.disabled) return
    if (opt.value !== props.modelValue) {
      emit('update:modelValue', opt.value)
      emit('change', opt.value)
    }
    hide()
  }

  function move(step) {
    const n = props.options.length
    if (!n) return
    let i = hoverIndex.value
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n
      if (!props.options[i].disabled) break
    }
    hoverIndex.value = i
    panel.value?.children[i]?.scrollIntoView?.({ block: 'nearest' })
  }

  function onKey(e) {
    if (props.disabled) return
    switch (e.key) {
      case 'ArrowDown':
        e.preventDefault()
        open.value ? move(1) : show()
        break
      case 'ArrowUp':
        e.preventDefault()
        open.value ? move(-1) : show()
        break
      case 'Enter':
      case ' ':
        e.preventDefault()
        if (open.value && hoverIndex.value >= 0) choose(props.options[hoverIndex.value])
        else toggle()
        break
      case 'Escape':
        hide()
        break
    }
  }

  function onDocMouseDown(e) {
    if (!root.value?.contains(e.target) && !panel.value?.contains(e.target)) hide()
  }

  watch(open, (v) => {
    const method = v ? 'addEventListener' : 'removeEventListener'
    document[method]('mousedown', onDocMouseDown)
    window[method]('resize', hide)
    window[method]('scroll', hide, true)
  })

  onBeforeUnmount(() => {
    document.removeEventListener('mousedown', onDocMouseDown)
    window.removeEventListener('resize', hide)
    window.removeEventListener('scroll', hide, true)
  })

  return { root, panel, open, hoverIndex, panelStyle, selected, show, hide, toggle, choose, onKey }
}
