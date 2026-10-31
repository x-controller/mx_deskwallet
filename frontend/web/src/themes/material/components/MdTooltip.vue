<script setup>
import { useTooltip } from '@/composables/ui/useTooltip'

const props = defineProps({
  content: { type: String, default: '' },
  /** top | bottom */
  placement: { type: String, default: 'bottom' },
})

/* 根节点是 span + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { trigger, bubble, visible, style, show, hide } = useTooltip(props, { gap: 8 })
</script>

<template>
  <span ref="trigger" v-bind="$attrs" class="md-tooltip__trigger" @mouseenter="show" @mouseleave="hide" @focusin="show" @focusout="hide" @mousedown="hide">
    <slot />
  </span>
  <Teleport to="body">
    <div v-if="visible" ref="bubble" class="md-tooltip" :style="style" role="tooltip">{{ content }}</div>
  </Teleport>
</template>

<style scoped>
.md-tooltip__trigger {
  display: inline-flex;
  min-width: 0;
}

.md-tooltip {
  position: fixed;
  z-index: var(--md-z-tooltip);
  max-width: 320px;
  padding: var(--md-space-1) var(--md-space-2);
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
  word-break: break-all;
  white-space: pre-line;
  pointer-events: none;
}
</style>
