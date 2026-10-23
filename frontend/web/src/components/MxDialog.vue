<script setup>
import { onBeforeUnmount, watch } from 'vue'
import { RiCloseLine } from '@remixicon/vue'
import MxButton from './MxButton.vue'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  title: { type: String, default: '' },
  width: { type: String, default: '480px' },
  /** 为 false 时隐藏关闭按钮且 Esc / 遮罩都不能关闭（如任务执行中） */
  closable: { type: Boolean, default: true },
  maskClosable: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'close'])

function close() {
  if (!props.closable) return
  emit('update:modelValue', false)
  emit('close')
}

function onMask() {
  if (props.maskClosable) close()
}

function onKey(e) {
  if (e.key === 'Escape') close()
}

watch(
  () => props.modelValue,
  (v) => {
    if (v) document.addEventListener('keydown', onKey)
    else document.removeEventListener('keydown', onKey)
  },
  { immediate: true },
)

onBeforeUnmount(() => document.removeEventListener('keydown', onKey))
</script>

<template>
  <Teleport to="body">
    <Transition name="mx-dialog">
      <div v-if="modelValue" class="mx-dialog__mask" @mousedown.self="onMask">
        <div class="mx-dialog" :style="{ width }" role="dialog" aria-modal="true" :aria-label="title">
          <header class="mx-dialog__header">
            <span class="mx-dialog__title">{{ title }}</span>
            <slot name="header-extra" />
            <MxButton v-if="closable" icon size="xs" aria-label="关闭" @click="close">
              <RiCloseLine size="16" />
            </MxButton>
          </header>
          <section class="mx-dialog__body"><slot /></section>
          <footer v-if="$slots.footer" class="mx-dialog__footer"><slot name="footer" /></footer>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mx-dialog__mask {
  position: fixed;
  inset: 0;
  z-index: var(--mx-z-dialog);
  display: flex;
  align-items: center;
  justify-content: center;
  padding: var(--mx-space-lg);
  background: var(--mx-color-mask);
}

.mx-dialog {
  display: flex;
  flex-direction: column;
  max-width: 100%;
  max-height: 100%;
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
  box-shadow: var(--mx-shadow-float);
}

.mx-dialog__header {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  padding: var(--mx-space-sm) var(--mx-space-sm) var(--mx-space-sm) var(--mx-space-md);
}

.mx-dialog__title {
  flex: 1;
  font-size: var(--mx-font-lg);
  font-weight: 600;
}

.mx-dialog__body {
  flex: 1;
  min-height: 0;
  overflow: auto;
  padding: 0 var(--mx-space-md) var(--mx-space-md);
}

.mx-dialog__footer {
  display: flex;
  justify-content: flex-end;
  gap: var(--mx-space-sm);
  padding: 0 var(--mx-space-md) var(--mx-space-md);
}

.mx-dialog-enter-active,
.mx-dialog-leave-active {
  transition: opacity var(--mx-transition);
}

.mx-dialog-enter-active .mx-dialog,
.mx-dialog-leave-active .mx-dialog {
  transition: transform var(--mx-transition);
}

.mx-dialog-enter-from,
.mx-dialog-leave-to {
  opacity: 0;
}

.mx-dialog-enter-from .mx-dialog,
.mx-dialog-leave-to .mx-dialog {
  transform: scale(0.96);
}
</style>
