<script setup>
import { computed, onMounted, ref, useAttrs } from 'vue'

const props = defineProps({
  modelValue: { type: [String, Number], default: '' },
  type: { type: String, default: 'text' },
  /** outlined | filled */
  variant: { type: String, default: 'outlined' },
  /** 浮动标签；为空时只有占位符 */
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  /** 字段下方的辅助说明 */
  supportingText: { type: String, default: '' },
  /** 错误提示，非空时显示错误态并替代辅助说明 */
  error: { type: String, default: '' },
  /** 桌面端紧凑高度 40px（规范 56px） */
  dense: { type: Boolean, default: false },
  /** 大于 0 时渲染为多行文本域 */
  rows: { type: Number, default: 0 },
  maxlength: { type: Number, default: undefined },
  disabled: { type: Boolean, default: false },
  readonly: { type: Boolean, default: false },
  autofocus: { type: Boolean, default: false },
  /** 输入内容用等宽字体（地址 / 哈希 / 私钥），标签与说明不受影响 */
  mono: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'enter', 'blur', 'focus'])

/* class / style 落在根节点，其余属性（tabindex、autocomplete 等）落到原生输入框 */
defineOptions({ inheritAttrs: false })
const attrs = useAttrs()
const rootAttrs = computed(() => ({ class: attrs.class, style: attrs.style }))
const inputAttrs = computed(() => Object.fromEntries(Object.entries(attrs).filter(([k]) => k !== 'class' && k !== 'style')))

const native = ref(null)
const focused = ref(false)
const populated = computed(() => props.modelValue !== '' && props.modelValue !== null && props.modelValue !== undefined)
const floated = computed(() => focused.value || populated.value || (!!props.placeholder && !props.label) || (!!props.placeholder && focused.value))
/** 有浮动标签时，占位符只在聚焦后显示，避免与标签重叠 */
const shownPlaceholder = computed(() => (props.label && !focused.value ? '' : props.placeholder))

function onFocus(e) {
  focused.value = true
  emit('focus', e)
}

function onBlur(e) {
  focused.value = false
  emit('blur', e)
}

function focus() {
  native.value?.focus()
}

onMounted(() => {
  if (props.autofocus) native.value?.focus()
})

defineExpose({ focus })
</script>

<template>
  <div
    v-bind="rootAttrs"
    class="md-field"
    :class="[
      `is-${variant}`,
      {
        'is-focused': focused,
        'is-floated': floated || !label,
        'has-label': !!label,
        'is-error': !!error,
        'is-disabled': disabled,
        'is-dense': dense,
        'is-textarea': rows > 0,
        'has-leading': $slots.leading,
        'has-trailing': $slots.trailing,
        'is-mono': mono,
      },
    ]"
  >
    <div class="md-field__container" @click="focus">
      <span v-if="$slots.leading" class="md-field__leading"><slot name="leading" /></span>
      <div class="md-field__input-wrap">
        <label v-if="label" class="md-field__label">{{ label }}</label>
        <textarea
          v-if="rows > 0"
          ref="native"
          v-bind="inputAttrs"
          class="md-field__input"
          :value="modelValue"
          :rows="rows"
          :placeholder="shownPlaceholder"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxlength"
          spellcheck="false"
          @input="emit('update:modelValue', $event.target.value)"
          @focus="onFocus"
          @blur="onBlur"
        />
        <input
          v-else
          ref="native"
          v-bind="inputAttrs"
          class="md-field__input"
          :type="type"
          :value="modelValue"
          :placeholder="shownPlaceholder"
          :disabled="disabled"
          :readonly="readonly"
          :maxlength="maxlength"
          spellcheck="false"
          @input="emit('update:modelValue', $event.target.value)"
          @keydown.enter="emit('enter', $event)"
          @focus="onFocus"
          @blur="onBlur"
        />
      </div>
      <span v-if="$slots.trailing" class="md-field__trailing"><slot name="trailing" /></span>
      <fieldset v-if="variant === 'outlined'" class="md-field__outline" aria-hidden="true">
        <legend class="md-field__legend"><span>{{ label }}</span></legend>
      </fieldset>
      <span v-else class="md-field__indicator" />
    </div>
    <p v-if="error || supportingText" class="md-field__supporting">{{ error || supportingText }}</p>
  </div>
</template>

<style scoped>
.md-field {
  --md-field-height: var(--md-comp-text-field-height);
  --md-field-color: var(--md-sys-color-on-surface-variant);
  --md-field-active: var(--md-sys-color-primary);
  --md-field-outline: var(--md-sys-color-outline);
  --md-field-outline-width: 1px;

  display: flex;
  flex-direction: column;
  min-width: 0;
}

.is-dense {
  --md-field-height: var(--md-comp-text-field-height-dense);
}

.is-error {
  --md-field-color: var(--md-sys-color-error);
  --md-field-active: var(--md-sys-color-error);
  --md-field-outline: var(--md-sys-color-error);
}

.is-focused {
  --md-field-outline: var(--md-field-active);
  --md-field-outline-width: 2px;
}

.md-field:hover:not(.is-disabled):not(.is-focused) {
  --md-field-outline: var(--md-sys-color-on-surface);
}

.md-field.is-error:hover:not(.is-disabled) {
  --md-field-outline: var(--md-sys-color-on-error-container);
}

.md-field__container {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  min-height: var(--md-field-height);
  padding: 0 var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-extra-small);
  cursor: text;
}

.is-filled .md-field__container {
  background: var(--md-sys-color-surface-container-highest);
  border-radius: var(--md-sys-shape-corner-extra-small) var(--md-sys-shape-corner-extra-small) 0 0;
}

.has-leading .md-field__container {
  padding-left: var(--md-space-3);
}

.has-trailing .md-field__container {
  padding-right: var(--md-space-3);
}

.md-field__leading,
.md-field__trailing {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.is-error .md-field__trailing {
  color: var(--md-sys-color-error);
}

.md-field__input-wrap {
  position: relative;
  display: flex;
  align-items: center;
  flex: 1;
  min-width: 0;
  height: 100%;
  min-height: var(--md-field-height);
}

.is-textarea .md-field__input-wrap {
  align-items: stretch;
  padding: var(--md-space-3) 0;
}

.is-textarea.has-label .md-field__input-wrap {
  padding-top: var(--md-space-5);
}

.is-filled.has-label .md-field__input-wrap:not(.is-textarea) {
  padding-top: var(--md-space-4);
}

.md-field__input {
  flex: 1;
  width: 100%;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  resize: none;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  caret-color: var(--md-field-active);
}

.is-dense .md-field__input {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.is-mono .md-field__input {
  font-family: var(--md-ref-typeface-mono);
  letter-spacing: 0;
}

.md-field__input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
}

.md-field__input:disabled {
  cursor: not-allowed;
}

.md-field__input[type='number'] {
  appearance: textfield;
}

.md-field__input::-webkit-inner-spin-button,
.md-field__input::-webkit-outer-spin-button {
  appearance: none;
}

/* 浮动标签 */
.md-field__label {
  position: absolute;
  left: 0;
  top: 50%;
  max-width: 100%;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md-field-color);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
  transform: translateY(-50%);
  transform-origin: left top;
  transition: transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), font-size var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), top var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  pointer-events: none;
}

.is-dense .md-field__label {
  font-size: var(--md-sys-typescale-body-medium-size);
}

.is-textarea .md-field__label {
  top: var(--md-space-5);
  transform: translateY(0);
}

.is-focused .md-field__label {
  color: var(--md-field-active);
}

.is-outlined.is-floated .md-field__label {
  top: 0;
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  transform: translateY(-50%);
}

.is-filled.is-floated .md-field__label {
  top: var(--md-space-2);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  transform: translateY(0);
}

.is-filled.is-dense.is-floated .md-field__label {
  top: 2px;
}

/* outlined 外框：fieldset + legend 在标签处留出缺口 */
.md-field__outline {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0 calc(var(--md-space-4) - 4px);
  border: var(--md-field-outline-width) solid var(--md-field-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  pointer-events: none;
  transition: border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.has-leading .md-field__outline {
  padding-left: calc(var(--md-space-3) + 24px + var(--md-space-3) - 4px);
}

.md-field__legend {
  display: block;
  max-width: 0.01px;
  height: 0;
  padding: 0;
  margin: 0;
  overflow: hidden;
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: 0;
  white-space: nowrap;
  visibility: hidden;
  transition: max-width var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.md-field__legend span {
  padding: 0 4px;
}

.is-outlined.is-floated.has-label .md-field__legend {
  max-width: 100%;
}

/* filled 底部指示线 */
.md-field__indicator {
  position: absolute;
  left: 0;
  right: 0;
  bottom: 0;
  height: var(--md-field-outline-width);
  background: var(--md-field-outline);
  transition: height var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard), background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-filled:hover:not(.is-disabled) .md-field__container::before {
  content: '';
  position: absolute;
  inset: 0;
  border-radius: inherit;
  background: var(--md-sys-color-on-surface);
  opacity: var(--md-sys-state-hover-opacity);
  pointer-events: none;
}

/* 辅助 / 错误文案 */
.md-field__supporting {
  margin: var(--md-space-1) var(--md-space-4) 0;
  color: var(--md-field-color);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
  letter-spacing: var(--md-sys-typescale-body-small-tracking);
}

/* 禁用 */
.is-disabled {
  --md-field-outline: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  --md-field-color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.is-disabled .md-field__container {
  cursor: not-allowed;
}

.is-disabled .md-field__input {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.is-disabled.is-filled .md-field__container {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 4%, transparent);
}
</style>
