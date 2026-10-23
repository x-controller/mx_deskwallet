<script setup>
import { nextTick, ref } from 'vue'

const props = defineProps({
  content: { type: String, default: '' },
  /** top | bottom */
  placement: { type: String, default: 'top' },
})

/* 根节点是 span + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

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
  const gap = 6
  const above = r.top - b.height - gap
  const below = r.bottom + gap
  // 首选方向放不下（贴着窗口边缘）时自动翻到另一侧
  let top = props.placement === 'bottom' ? below : above
  if (top < 4) top = below
  else if (top + b.height > window.innerHeight - 4) top = above
  const left = Math.min(Math.max(4, r.left + r.width / 2 - b.width / 2), window.innerWidth - b.width - 4)
  style.value = { top: `${top}px`, left: `${left}px` }
}

function hide() {
  visible.value = false
}
</script>

<template>
  <span ref="trigger" v-bind="$attrs" class="mx-tooltip__trigger" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide" @mousedown="hide">
    <slot />
  </span>
  <Teleport to="body">
    <div v-if="visible" ref="bubble" class="mx-tooltip" :style="style" role="tooltip">{{ content }}</div>
  </Teleport>
</template>

<style scoped>
.mx-tooltip__trigger {
  display: inline-flex;
  min-width: 0;
}

.mx-tooltip {
  position: fixed;
  z-index: var(--mx-z-tooltip);
  max-width: 320px;
  padding: var(--mx-space-xs) var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-primary);
  color: var(--mx-color-on-primary);
  font-size: var(--mx-font-sm);
  line-height: 1.4;
  word-break: break-all;
  white-space: pre-line;
  pointer-events: none;
}
</style>
