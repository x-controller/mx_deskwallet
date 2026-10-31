<script setup>
import MdIcon from './MdIcon.vue'
import { messages } from '@/utils/message'

const ICONS = { success: 'check_circle', error: 'error', info: 'info' }
</script>

<template>
  <Teleport to="body">
    <div class="md-snackbar-host">
      <TransitionGroup name="md-snackbar">
        <div v-for="m in messages" :key="m.id" class="md-snackbar" :class="`is-${m.type}`" role="status">
          <MdIcon :name="ICONS[m.type]" :size="20" class="md-snackbar__icon" />
          <span class="md-snackbar__text">{{ m.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.md-snackbar-host {
  position: fixed;
  left: 50%;
  bottom: var(--md-space-6);
  z-index: var(--md-z-snackbar);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--md-space-2);
  transform: translateX(-50%);
  pointer-events: none;
}

.md-snackbar {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  min-width: var(--md-comp-snackbar-min-width);
  max-width: 560px;
  padding: var(--md-space-3) var(--md-space-4);
  background: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level3);
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.md-snackbar__icon {
  color: var(--md-sys-color-inverse-primary);
}

.is-error .md-snackbar__icon {
  color: var(--md-sys-color-error-container);
}

.md-snackbar__text {
  flex: 1;
  word-break: break-all;
}

.md-snackbar-enter-active,
.md-snackbar-leave-active {
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), transform var(--md-sys-motion-duration-medium2) var(--md-sys-motion-easing-emphasized-decelerate);
}

.md-snackbar-enter-from,
.md-snackbar-leave-to {
  opacity: 0;
  transform: translateY(16px);
}
</style>
