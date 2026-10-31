import { nextTick, onBeforeUnmount, ref, watch } from 'vue'

/**
 * 操作菜单（触发按钮 + 浮层列表）的交互：开合、固定定位（触发器靠窗口右侧时右对齐、放不下翻到上方）、
 * 键盘导航、外部点击 / 滚动关闭。组件只负责渲染。
 * props 需要 items（[{ key, label, hint?, disabled?, danger? }]）、disabled
 */
export function useMenu(props, emit, { gap = 4 } = {}) {
  const root = ref(null)
  const panel = ref(null)
  const open = ref(false)
  const hoverIndex = ref(-1)
  const panelStyle = ref({})

  function place() {
    if (!root.value || !panel.value) return
    const r = root.value.getBoundingClientRect()
    const h = panel.value.offsetHeight
    const w = panel.value.offsetWidth
    const below = window.innerHeight - r.bottom
    const top = below < h + gap && r.top > below ? r.top - h - gap : r.bottom + gap
    const alignRight = r.left + w > window.innerWidth - gap
    const left = alignRight ? Math.max(gap, r.right - w) : r.left
    panelStyle.value = { top: `${top}px`, left: `${left}px` }
  }

  async function show() {
    if (props.disabled) return
    open.value = true
    hoverIndex.value = -1
    await nextTick()
    place()
  }

  function hide() {
    open.value = false
  }

  function toggle() {
    open.value ? hide() : show()
  }

  function choose(item) {
    if (item.disabled) return
    emit('select', item.key)
    hide()
  }

  function move(step) {
    const n = props.items.length
    if (!n) return
    let i = hoverIndex.value
    for (let k = 0; k < n; k++) {
      i = (i + step + n) % n
      if (!props.items[i].disabled) break
    }
    hoverIndex.value = i
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
        if (open.value && hoverIndex.value >= 0) choose(props.items[hoverIndex.value])
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

  return { root, panel, open, hoverIndex, panelStyle, show, hide, toggle, choose, onKey }
}
