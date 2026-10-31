<script setup>
import MdIcon from './MdIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

function onChange(e) {
  emit('update:modelValue', e.target.checked)
  emit('change', e.target.checked)
}
</script>

<template>
  <label class="md-switch" :class="{ 'is-on': modelValue, 'is-disabled': disabled }" @click.stop>
    <span class="md-switch__track">
      <input class="md-switch__native" type="checkbox" role="switch" :checked="modelValue" :disabled="disabled" @change="onChange" />
      <span class="md-switch__handle">
        <span class="md-switch__state" />
        <MdIcon v-if="modelValue" name="check" :size="16" class="md-switch__icon" />
      </span>
    </span>
    <span v-if="$slots.default" class="md-switch__label"><slot /></span>
  </label>
</template>

<style scoped>
.md-switch {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-3);
  cursor: pointer;
  user-select: none;
  color: var(--md-sys-color-on-surface);
}

.md-switch__track {
  position: relative;
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  width: var(--md-comp-switch-track-width);
  height: var(--md-comp-switch-track-height);
  padding: 0 var(--md-space-1);
  border: 2px solid var(--md-sys-color-outline);
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-highest);
  transition: background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-on .md-switch__track {
  background: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.md-switch__native {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.md-switch__handle {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 16px;
  height: 16px;
  margin-left: 2px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-outline);
  color: var(--md-sys-color-on-primary-container);
  transition: transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), width var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), height var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  pointer-events: none;
}

.md-switch:active:not(.is-disabled) .md-switch__handle {
  width: 28px;
  height: 28px;
  margin-left: -4px;
}

.is-on .md-switch__handle {
  width: 24px;
  height: 24px;
  margin-left: 0;
  background: var(--md-sys-color-on-primary);
  transform: translateX(18px);
}

.is-on:active:not(.is-disabled) .md-switch__handle {
  width: 28px;
  height: 28px;
  margin-left: -2px;
  transform: translateX(16px);
}

.md-switch__state {
  position: absolute;
  inset: -8px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-on-surface);
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short2) linear;
}

.is-on .md-switch__state {
  background: var(--md-sys-color-primary);
}

.md-switch:hover:not(.is-disabled) .md-switch__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-switch__native:focus-visible ~ .md-switch__handle .md-switch__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-switch__icon {
  position: relative;
  color: var(--md-sys-color-on-primary-container);
}

.md-switch__label {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.is-disabled {
  cursor: not-allowed;
  opacity: 0.38;
}
</style>
