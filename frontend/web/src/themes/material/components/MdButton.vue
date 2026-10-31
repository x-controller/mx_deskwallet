<script setup>
import MdProgress from './MdProgress.vue'
import { ripple as vRipple } from '../ripple'

defineProps({
  /** filled | tonal | outlined | text | elevated */
  variant: { type: String, default: 'filled' },
  /** primary | error */
  color: { type: String, default: 'primary' },
  /** 桌面端紧凑高度 32px（规范 40px） */
  dense: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  nativeType: { type: String, default: 'button' },
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    v-ripple
    class="md-button"
    :class="[`is-${variant}`, `is-${color}`, { 'is-dense': dense, 'is-block': block, 'has-icon': $slots.icon || loading }]"
    :type="nativeType"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <span class="md-button__state" />
    <MdProgress v-if="loading" :size="dense ? 16 : 18" class="md-button__icon" />
    <span v-else-if="$slots.icon" class="md-button__icon"><slot name="icon" /></span>
    <span class="md-button__label"><slot /></span>
  </button>
</template>

<style scoped>
.md-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-2);
  flex-shrink: 0;
  height: var(--md-comp-button-height);
  padding: 0 var(--md-space-6);
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-full);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  font-weight: var(--md-sys-typescale-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: box-shadow var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.md-button__state {
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  pointer-events: none;
}

.md-button:hover:not(:disabled) .md-button__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-button:focus-visible {
  outline: none;
}

.md-button:focus-visible .md-button__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-button:active:not(:disabled) .md-button__state {
  opacity: var(--md-sys-state-pressed-opacity);
}

.md-button__icon,
.md-button__label {
  position: relative;
  display: inline-flex;
  align-items: center;
}

.md-button__icon {
  margin-left: calc(var(--md-space-2) * -1);
}

.md-button__icon :deep(.md-icon) {
  width: 18px;
  height: 18px;
}

.is-dense {
  height: var(--md-comp-button-height-dense);
  padding: 0 var(--md-space-4);
}

.is-dense .md-button__icon {
  margin-left: calc(var(--md-space-1) * -1);
}

.is-dense .md-button__icon :deep(.md-icon) {
  width: 16px;
  height: 16px;
}

.is-block {
  display: flex;
  width: 100%;
}

/* filled */
.is-filled {
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.is-filled.is-error {
  background: var(--md-sys-color-error);
  color: var(--md-sys-color-on-error);
}

.is-filled:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level1);
}

/* tonal */
.is-tonal {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.is-tonal.is-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.is-tonal:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level1);
}

/* elevated */
.is-elevated {
  background: var(--md-sys-color-surface-container-low);
  color: var(--md-sys-color-primary);
  box-shadow: var(--md-sys-elevation-level1);
}

.is-elevated:hover:not(:disabled) {
  box-shadow: var(--md-sys-elevation-level2);
}

/* outlined */
.is-outlined {
  background: transparent;
  color: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-outline);
}

.is-outlined.is-error,
.is-text.is-error,
.is-elevated.is-error {
  color: var(--md-sys-color-error);
}

/* text */
.is-text {
  background: transparent;
  color: var(--md-sys-color-primary);
  padding: 0 var(--md-space-3);
}

.is-text.has-icon {
  padding-right: var(--md-space-4);
}

.is-text .md-button__icon {
  margin-left: 0;
}

/* disabled */
.md-button:disabled {
  cursor: not-allowed;
  box-shadow: none;
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.is-filled:disabled,
.is-tonal:disabled,
.is-elevated:disabled {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}

.is-outlined:disabled {
  border-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}
</style>
