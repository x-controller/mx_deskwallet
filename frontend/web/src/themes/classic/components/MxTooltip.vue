<script setup>
import { useTooltip } from '@/composables/ui/useTooltip'

const props = defineProps({
  content: { type: String, default: '' },
  /** top | bottom */
  placement: { type: String, default: 'top' },
})

/* 根节点是 span + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { trigger, bubble, visible, style, show, hide } = useTooltip(props)
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
