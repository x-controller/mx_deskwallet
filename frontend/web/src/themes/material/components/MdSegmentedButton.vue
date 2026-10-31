<script setup>
import MdIcon from './MdIcon.vue'
import { ripple as vRipple } from '../ripple'

defineProps({
  modelValue: { type: [String, Number], default: '' },
  /** [{ value, label, icon? }] */
  options: { type: Array, default: () => [] },
  /** 桌面端紧凑高度 32px（规范 40px） */
  dense: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])
</script>

<template>
  <div class="md-segmented" :class="{ 'is-dense': dense, 'is-disabled': disabled }" role="radiogroup">
    <button
      v-for="opt in options"
      :key="opt.value"
      v-ripple
      class="md-segmented__item"
      :class="{ 'is-selected': opt.value === modelValue }"
      type="button"
      role="radio"
      :aria-checked="opt.value === modelValue"
      :disabled="disabled"
      @click="emit('update:modelValue', opt.value)"
    >
      <span class="md-segmented__state" />
      <MdIcon v-if="opt.value === modelValue" name="check" :size="18" class="md-segmented__icon" />
      <MdIcon v-else-if="opt.icon" :name="opt.icon" :size="18" class="md-segmented__icon" />
      <span class="md-segmented__label">{{ opt.label }}</span>
    </button>
  </div>
</template>

<style scoped>
.md-segmented {
  display: inline-flex;
  align-items: stretch;
  height: var(--md-comp-button-height);
  border: 1px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  overflow: hidden;
}

.is-dense {
  height: var(--md-comp-button-height-dense);
}

.md-segmented__item {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-2);
  padding: 0 var(--md-space-4);
  overflow: hidden;
  border: none;
  border-left: 1px solid var(--md-sys-color-outline);
  background: transparent;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  font-weight: var(--md-sys-typescale-weight-medium);
  white-space: nowrap;
  cursor: pointer;
  user-select: none;
  transition: background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-dense .md-segmented__item {
  padding: 0 var(--md-space-3);
}

.md-segmented__item:first-child {
  border-left: none;
}

.md-segmented__item.is-selected {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-segmented__state {
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short2) linear;
  pointer-events: none;
}

.md-segmented__item:hover:not(:disabled) .md-segmented__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-segmented__item:focus-visible {
  outline: none;
}

.md-segmented__item:focus-visible .md-segmented__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-segmented__icon,
.md-segmented__label {
  position: relative;
}

.is-disabled {
  border-color: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
}

.md-segmented__item:disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}
</style>
