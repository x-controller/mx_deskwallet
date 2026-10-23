<script setup>
import MxSpinner from './MxSpinner.vue'

defineProps({
  /** default：灰底；surface：面板色底（放在灰底行内用）；primary：主色；danger：危险 */
  type: { type: String, default: 'default' },
  /** xs | sm | md | lg */
  size: { type: String, default: 'md' },
  /** 仅图标的正方形按钮 */
  icon: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
  block: { type: Boolean, default: false },
  nativeType: { type: String, default: 'button' },
})

const emit = defineEmits(['click'])
</script>

<template>
  <button
    class="mx-button"
    :class="[`is-${type}`, `is-${size}`, { 'is-icon': icon, 'is-block': block }]"
    :type="nativeType"
    :disabled="disabled || loading"
    @click="emit('click', $event)"
  >
    <MxSpinner v-if="loading" :size="size === 'lg' ? 16 : 13" />
    <span v-if="!(loading && icon)" class="mx-button__content"><slot /></span>
  </button>
</template>

<style scoped>
.mx-button {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--mx-space-xs);
  flex-shrink: 0;
  padding: 0 var(--mx-space-sm);
  border: none;
  border-radius: var(--mx-radius-md);
  background: var(--mx-color-bg);
  color: var(--mx-color-text);
  cursor: pointer;
  white-space: nowrap;
  user-select: none;
  transition: background var(--mx-transition), opacity var(--mx-transition);
}

.mx-button__content {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
}

.is-xs {
  height: var(--mx-size-xs);
  font-size: var(--mx-font-sm);
  padding: 0 var(--mx-space-xs);
}

.is-sm {
  height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
}

.is-md {
  height: var(--mx-size-md);
  padding: 0 var(--mx-space-md);
}

.is-lg {
  height: var(--mx-size-lg);
  font-size: var(--mx-font-lg);
  padding: 0 var(--mx-space-lg);
}

.is-icon {
  padding: 0;
}

.is-icon.is-xs {
  width: var(--mx-size-xs);
}

.is-icon.is-sm {
  width: var(--mx-size-sm);
}

.is-icon.is-md {
  width: var(--mx-size-md);
}

.is-icon.is-lg {
  width: var(--mx-size-lg);
}

.is-block {
  display: flex;
  width: 100%;
}

.mx-button:hover:not(:disabled) {
  background: var(--mx-color-bg-hover);
}

.mx-button:active:not(:disabled) {
  background: var(--mx-color-bg-active);
}

.is-surface {
  background: var(--mx-color-surface);
}

.is-primary {
  background: var(--mx-color-primary);
  color: var(--mx-color-on-primary);
}

.is-danger {
  background: var(--mx-color-danger);
  color: var(--mx-color-on-danger);
}

.is-primary:hover:not(:disabled),
.is-danger:hover:not(:disabled) {
  background: var(--mx-color-primary);
  opacity: 0.86;
}

.is-danger:hover:not(:disabled) {
  background: var(--mx-color-danger);
}

.is-primary:active:not(:disabled),
.is-danger:active:not(:disabled) {
  opacity: 0.75;
}

.mx-button:disabled {
  opacity: 0.5;
  cursor: not-allowed;
}

.mx-button:focus-visible {
  outline: 2px solid var(--mx-btn-group-focus-ring);
  outline-offset: 1px;
}
</style>
