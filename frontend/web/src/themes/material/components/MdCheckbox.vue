<script setup>
import MdIcon from './MdIcon.vue'

defineProps({
  modelValue: { type: Boolean, default: false },
  indeterminate: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

function onChange(e) {
  emit('update:modelValue', e.target.checked)
  emit('change', e.target.checked)
}
</script>

<template>
  <label class="md-checkbox" :class="{ 'is-checked': modelValue || indeterminate, 'is-disabled': disabled }" @click.stop>
    <span class="md-checkbox__target">
      <input class="md-checkbox__native" type="checkbox" :checked="modelValue" :disabled="disabled" :aria-checked="indeterminate ? 'mixed' : modelValue" @change="onChange" />
      <span class="md-checkbox__state" />
      <span class="md-checkbox__box">
        <MdIcon v-if="indeterminate" name="remove" :size="16" />
        <MdIcon v-else-if="modelValue" name="check" :size="16" />
      </span>
    </span>
    <span v-if="$slots.default" class="md-checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.md-checkbox {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  cursor: pointer;
  user-select: none;
  color: var(--md-sys-color-on-surface);
}

.md-checkbox__target {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--md-comp-checkbox-target);
  height: var(--md-comp-checkbox-target);
  flex-shrink: 0;
  border-radius: var(--md-sys-shape-corner-full);
  color: var(--md-sys-color-on-surface);
}

.is-checked .md-checkbox__target {
  color: var(--md-sys-color-primary);
}

.md-checkbox__native {
  position: absolute;
  inset: 0;
  margin: 0;
  opacity: 0;
  cursor: inherit;
}

.md-checkbox__state {
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short2) linear;
  pointer-events: none;
}

.md-checkbox:hover:not(.is-disabled) .md-checkbox__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-checkbox__native:focus-visible ~ .md-checkbox__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-checkbox:active:not(.is-disabled) .md-checkbox__state {
  opacity: var(--md-sys-state-pressed-opacity);
}

.md-checkbox__box {
  position: relative;
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--md-comp-checkbox-size);
  height: var(--md-comp-checkbox-size);
  border: 2px solid var(--md-sys-color-on-surface-variant);
  border-radius: 2px;
  color: var(--md-sys-color-on-primary);
  transition: background var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
  pointer-events: none;
}

.is-checked .md-checkbox__box {
  background: var(--md-sys-color-primary);
  border-color: var(--md-sys-color-primary);
}

.md-checkbox__label {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.is-disabled {
  cursor: not-allowed;
}

.is-disabled .md-checkbox__box {
  border-color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.is-disabled.is-checked .md-checkbox__box {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  border-color: transparent;
}

.is-disabled .md-checkbox__label {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}
</style>
