<script setup>
defineProps({
  /** 容器色调：neutral | primary | secondary | tertiary | error | success | warning */
  tone: { type: String, default: 'neutral' },
  /** md 32px（规范 chip）| sm 24px（行内标签） */
  size: { type: String, default: 'sm' },
  /** 描边样式（assist chip），忽略 tone 底色 */
  outlined: { type: Boolean, default: false },
})
</script>

<template>
  <span class="md-chip" :class="[`is-${tone}`, `is-${size}`, { 'is-outlined': outlined }]">
    <span v-if="$slots.icon" class="md-chip__icon"><slot name="icon" /></span>
    <span class="md-chip__label"><slot /></span>
  </span>
</template>

<style scoped>
.md-chip {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  flex-shrink: 0;
  height: var(--md-comp-chip-height);
  padding: 0 var(--md-space-3);
  border: 1px solid transparent;
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-surface-container-highest);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  font-weight: var(--md-sys-typescale-weight-medium);
  white-space: nowrap;
}

.is-sm {
  height: 24px;
  padding: 0 var(--md-space-2);
  font-size: var(--md-sys-typescale-label-medium-size);
  line-height: var(--md-sys-typescale-label-medium-line-height);
  letter-spacing: var(--md-sys-typescale-label-medium-tracking);
}

.md-chip__icon {
  display: inline-flex;
  margin-left: calc(var(--md-space-1) * -1);
}

.md-chip__icon :deep(.md-icon) {
  width: 18px;
  height: 18px;
}

.is-sm .md-chip__icon :deep(.md-icon) {
  width: 14px;
  height: 14px;
}

.is-primary {
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.is-secondary {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.is-tertiary {
  background: var(--md-sys-color-tertiary-container);
  color: var(--md-sys-color-on-tertiary-container);
}

.is-error {
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.is-success {
  background: var(--md-sys-color-success-container);
  color: var(--md-sys-color-on-success-container);
}

.is-warning {
  background: var(--md-sys-color-warning-container);
  color: var(--md-sys-color-on-warning-container);
}

.is-outlined {
  background: transparent;
  border-color: var(--md-sys-color-outline);
  color: var(--md-sys-color-on-surface);
}
</style>
