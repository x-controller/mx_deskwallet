<script setup>
import MdIcon from './MdIcon.vue'
import MdIconButton from './MdIconButton.vue'
import { useDialog } from '@/composables/ui/useDialog'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  /** 标题上方的 hero 图标（Material Symbols 名称），可选 */
  icon: { type: String, default: '' },
  /** 最大宽度；基础弹窗规范 280 ~ 560px，宽表单可放大 */
  width: { type: String, default: '560px' },
  /** 为 false 时隐藏关闭按钮且 Esc / 遮罩都不能关闭（如任务执行中） */
  closable: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

const { close, onMask } = useDialog(props, emit)
</script>

<template>
  <Teleport to="body">
    <Transition name="md-dialog">
      <div v-if="modelValue" class="md-scrim" @mousedown.self="onMask">
        <div class="md-dialog" :class="{ 'has-icon': icon }" :style="{ maxWidth: width }" role="dialog" aria-modal="true" :aria-label="title">
          <header class="md-dialog__header">
            <MdIcon v-if="icon" :name="icon" :size="24" class="md-dialog__hero" />
            <h2 class="md-dialog__headline">{{ title }}</h2>
            <slot name="header-extra" />
            <MdIconButton v-if="closable" size="sm" aria-label="关闭" class="md-dialog__close" @click="close">
              <MdIcon name="close" />
            </MdIconButton>
          </header>
          <section class="md-dialog__body"><slot /></section>
          <footer v-if="$slots.footer" class="md-dialog__actions"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.md-scrim {
  position: fixed;
  inset: 0;
  z-index: var(--md-z-dialog);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--md-space-6);
  background: color-mix(in srgb, var(--md-sys-color-scrim) 32%, transparent);
}

.md-dialog {
  display: flex;
  flex-direction: column;
  width: 100%;
  min-width: var(--md-comp-dialog-min-width);
  max-height: 100%;
  padding: var(--md-space-6);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  border-radius: var(--md-sys-shape-corner-extra-large);
  box-shadow: var(--md-sys-elevation-level3);
}

.md-dialog__header {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  margin-bottom: var(--md-space-4);
}

.has-icon .md-dialog__header {
  flex-direction: column;
  align-items: center;
  text-align: center;
}

.md-dialog__hero {
  color: var(--md-sys-color-secondary);
}

.md-dialog__headline {
  flex: 1;
  min-width: 0;
  margin: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--md-sys-typescale-headline-small-size);
  line-height: var(--md-sys-typescale-headline-small-line-height);
  font-weight: var(--md-sys-typescale-weight-regular);
}

.has-icon .md-dialog__close {
  position: absolute;
  top: var(--md-space-4);
  right: var(--md-space-4);
}

.md-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  margin: 0 calc(var(--md-space-6) * -1);
  padding: 0 var(--md-space-6);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.md-dialog__actions {
  display: flex;
  justify-content: flex-end;
  align-items: center;
  gap: var(--md-space-2);
  margin-top: var(--md-space-6);
}

.md-dialog-enter-active,
.md-dialog-leave-active {
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.md-dialog-enter-active .md-dialog {
  transition: transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate), opacity var(--md-sys-motion-duration-short4) linear;
}

.md-dialog-leave-active .md-dialog {
  transition: transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-emphasized-accelerate), opacity var(--md-sys-motion-duration-short4) linear;
}

.md-dialog-enter-from,
.md-dialog-leave-to {
  opacity: 0;
}

.md-dialog-enter-from .md-dialog,
.md-dialog-leave-to .md-dialog {
  transform: scale(0.9);
  opacity: 0;
}
</style>
