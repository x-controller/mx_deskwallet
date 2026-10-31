<script setup>
import MdProgress from './MdProgress.vue'
import { ripple as vRipple } from '../ripple'

defineProps({
  /** standard | filled | tonal | outlined */
  variant: { type: String, default: 'standard' },
  /** primary | error */
  color: { type: String, default: 'primary' },
  /** md 40px | sm 32px | xs 24px（行内紧凑） */
  size: { type: String, default: 'md' },
  /** 切换型按钮的选中态 */
  selected: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])

const ICON = { md: 24, sm: 20, xs: 18 }
</script>

<template>
  <button
    v-ripple
    class="md-icon-button"
    :class="[`is-${variant}`, `is-${color}`, `is-${size}`, { 'is-selected': selected }]"
    type="button"
    :disabled="disabled || loading"
    :aria-pressed="selected || undefined"
    @click="emit('click', $event)"
  >
    <span class="md-icon-button__state" />
    <MdProgress v-if="loading" :size="ICON[size] - 4" class="md-icon-button__content" />
    <span v-else class="md-icon-button__content" :style="{ '--md-icon-size': `${ICON[size]}px` }"><slot /></span>
  </button>
</template>

<style scoped>
.md-icon-button {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
  width: var(--md-comp-icon-button-size);
  height: var(--md-comp-icon-button-size);
  padding: 0;
  overflow: hidden;
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  cursor: pointer;
  user-select: none;
  transition: background-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.md-icon-button__state {
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  pointer-events: none;
}

.md-icon-button:hover:not(:disabled) .md-icon-button__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-icon-button:focus-visible {
  outline: none;
}

.md-icon-button:focus-visible .md-icon-button__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-icon-button:active:not(:disabled) .md-icon-button__state {
  opacity: var(--md-sys-state-pressed-opacity);
}

.md-icon-button__content {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
}

.md-icon-button__content :deep(.md-icon) {
  width: var(--md-icon-size);
  height: var(--md-icon-size);
}

.is-sm {
  width: var(--md-comp-icon-button-size-dense);
  height: var(--md-comp-icon-button-size-dense);
}

.is-xs {
  width: 24px;
  height: 24px;
}

/* standard */
.is-standard.is-selected {
  color: var(--md-sys-color-primary);
}

.is-standard.is-error {
  color: var(--md-sys-color-error);
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

/* tonal */
.is-tonal {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.is-tonal.is-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

/* outlined */
.is-outlined {
  border-color: var(--md-sys-color-outline);
  color: var(--md-sys-color-on-surface-variant);
}

.is-outlined.is-selected {
  background: var(--md-sys-color-inverse-surface);
  color: var(--md-sys-color-inverse-on-surface);
  border-color: transparent;
}

/* disabled */
.md-icon-button:disabled {
  cursor: not-allowed;
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.is-filled:disabled,
.is-tonal:disabled {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}

.is-outlined:disabled {
  border-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}
</style>
