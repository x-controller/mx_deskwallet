import { nextTick, ref } from 'vue'

/**
 * 文字提示的显隐与定位：固定定位在触发器上方 / 下方，贴边时自动翻面并夹在窗口内。
 * props 需要 content、placement（top | bottom）
 */
export function useTooltip(props, { gap = 6, margin = 4 } = {}) {
  const trigger = ref(null)
  const bubble = ref(null)
  const visible = ref(false)
  const style = ref({})

  async function show() {
    if (!props.content) return
    visible.value = true
    await nextTick()
    if (!trigger.value || !bubble.value) return
    const r = trigger.value.getBoundingClientRect()
    const b = bubble.value.getBoundingClientRect()
    const above = r.top - b.height - gap
    const below = r.bottom + gap
    let top = props.placement === 'bottom' ? below : above
    if (top < margin) top = below
    else if (top + b.height > window.innerHeight - margin) top = above
    const left = Math.min(Math.max(margin, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - margin)
    style.value = { top: `${top}px`, left: `${left}px` }
  }

  function hide() {
    visible.value = false
  }

  return { trigger, bubble, visible, style, show, hide }
}
