<script setup>
import { onMounted, ref } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  placeholder: { type: String, default: '' },
  /** sm | md | lg */
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  /** 错误提示，非空时显示错误态 */
  error: { type: String, default: '' },
  /** 大于 0 时渲染为多行文本域 */
  rows: { type: Number, default: 0 },
  autofocus: { type: Boolean, default: false },
  maxlength: { type: Number, default: undefined },
})

const emit = defineEmits(['update:modelValue', 'enter', 'blur', 'focus'])
const native = ref(null)

onMounted(() => {
  if (props.autofocus) native.value?.focus()
})

defineExpose({ focus: () => native.value?.focus() })
</script>

<template>
  <div class="mx-input-wrap">
    <div
      class="mx-input"
      :class="[`is-${size}`, { 'is-error': error, 'is-disabled': disabled, 'is-textarea': rows > 0 }]"
    >
      <span v-if="$slots.prefix" class="mx-input__affix"><slot name="prefix" /></span>
      <textarea
        v-if="rows > 0"
        ref="native"
        class="mx-input__native"
        :value="modelValue"
        :rows="rows"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        spellcheck="false"
        @input="emit('update:modelValue', $event.target.value)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <input
        v-else
        ref="native"
        class="mx-input__native"
        :type="type"
        :value="modelValue"
        :placeholder="placeholder"
        :disabled="disabled"
        :readonly="readonly"
        :maxlength="maxlength"
        spellcheck="false"
        @input="emit('update:modelValue', $event.target.value)"
        @keydown.enter="emit('enter', $event)"
        @blur="emit('blur', $event)"
        @focus="emit('focus', $event)"
      />
      <span v-if="$slots.suffix" class="mx-input__affix"><slot name="suffix" /></span>
    </div>
    <p v-if="error" class="mx-input__error">{{ error }}</p>
  </div>
</template>

<style scoped>
.mx-input-wrap {
  min-width: 0;
}

.mx-input {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  padding: 0 var(--mx-space-sm);
  background: var(--mx-color-bg);
  border: 1px solid transparent;
  border-radius: var(--mx-radius-md);
  transition: border-color var(--mx-transition), background var(--mx-transition);
}

.is-sm {
  height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
}

.is-md {
  height: var(--mx-size-md);
}

.is-lg {
  height: var(--mx-size-lg);
  font-size: var(--mx-font-lg);
}

.is-textarea {
  height: auto;
  padding: var(--mx-space-xs) var(--mx-space-sm);
}

.mx-input:focus-within {
  border-color: var(--mx-color-primary);
  background: var(--mx-color-surface);
}

.is-error,
.is-error:focus-within {
  border-color: var(--mx-color-danger);
}

.is-disabled {
  opacity: 0.6;
}

.mx-input__native {
  flex: 1;
  min-width: 0;
  width: 100%;
  height: 100%;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  line-height: 1.5;
}

.mx-input__native::placeholder {
  color: var(--mx-color-text-disabled);
}

.mx-input__affix {
  display: inline-flex;
  align-items: center;
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
}

.mx-input__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
}
</style>
