<script setup>
import { RiCheckLine, RiSubtractLine } from '@remixicon/vue'

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
  <label class="mx-checkbox" :class="{ 'is-checked': modelValue || indeterminate, 'is-disabled': disabled }" @click.stop>
    <input class="mx-checkbox__native" type="checkbox" :checked="modelValue" :disabled="disabled" @change="onChange" />
    <span class="mx-checkbox__box">
      <RiSubtractLine v-if="indeterminate" size="12" />
      <RiCheckLine v-else-if="modelValue" size="12" />
    </span>
    <span v-if="$slots.default" class="mx-checkbox__label"><slot /></span>
  </label>
</template>

<style scoped>
.mx-checkbox {
  position: relative;
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-sm);
  cursor: pointer;
  user-select: none;
}

.mx-checkbox__native {
  position: absolute;
  width: 1px;
  height: 1px;
  margin: 0;
  opacity: 0;
  pointer-events: none;
}

.mx-checkbox__box {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: var(--mx-size-checkbox);
  height: var(--mx-size-checkbox);
  flex-shrink: 0;
  border: 1px solid var(--mx-color-border);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-surface);
  color: var(--mx-color-on-primary);
  transition: background var(--mx-transition), border-color var(--mx-transition);
}

.mx-checkbox:hover .mx-checkbox__box {
  border-color: var(--mx-color-primary);
}

.is-checked .mx-checkbox__box {
  background: var(--mx-color-primary);
  border-color: var(--mx-color-primary);
}

.mx-checkbox__native:focus-visible + .mx-checkbox__box {
  outline: 2px solid var(--mx-btn-group-focus-ring);
  outline-offset: 1px;
}

.is-disabled {
  cursor: not-allowed;
  opacity: 0.5;
}

.mx-checkbox__label {
  font-size: var(--mx-font-md);
}
</style>
