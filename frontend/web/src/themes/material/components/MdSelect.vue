<script setup>
import { computed } from 'vue'
import MdIcon from './MdIcon.vue'
import { useSelect } from '@/composables/ui/useSelect'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  /** [{ label, value, disabled? }] */
  options: { type: Array, default: () => [] },
  label: { type: String, default: '' },
  placeholder: { type: String, default: '' },
  /** 错误提示 */
  error: { type: String, default: '' },
  /** 桌面端紧凑高度 40px */
  dense: { type: Boolean, default: false },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

/* 根节点是 div + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { root, panel, open, hoverIndex, panelStyle, selected, toggle, choose, onKey } = useSelect(props, emit, { gap: 4 })
const floated = computed(() => open.value || !!selected.value || !props.label)
</script>

<template>
  <div
    ref="root"
    v-bind="$attrs"
    class="md-select"
    :class="{ 'is-open': open, 'is-disabled': disabled, 'is-dense': dense, 'is-error': !!error, 'is-floated': floated, 'has-label': !!label }"
    :tabindex="disabled ? -1 : 0"
    role="combobox"
    :aria-expanded="open"
    :aria-label="label || placeholder"
    @click="toggle"
    @keydown="onKey"
  >
    <div class="md-select__container">
      <label v-if="label" class="md-select__label">{{ label }}</label>
      <span class="md-select__value" :class="{ 'is-placeholder': !selected }">
        <slot name="label" :option="selected">{{ selected ? selected.label : floated ? placeholder : '' }}</slot>
      </span>
      <MdIcon name="arrow_drop_down" class="md-select__arrow" :size="24" />
      <fieldset class="md-select__outline" aria-hidden="true">
        <legend class="md-select__legend"><span>{{ label }}</span></legend>
      </fieldset>
    </div>
    <p v-if="error" class="md-select__supporting">{{ error }}</p>
  </div>
  <Teleport to="body">
    <Transition name="md-menu">
      <div v-if="open" ref="panel" class="md-menu" :class="{ 'is-dense': dense }" :style="panelStyle" role="listbox">
        <template v-if="options.length">
          <div
            v-for="(opt, i) in options"
            :key="opt.value"
            class="md-menu__item"
            :class="{ 'is-selected': opt.value === modelValue, 'is-hover': i === hoverIndex, 'is-disabled': opt.disabled }"
            role="option"
            :aria-selected="opt.value === modelValue"
            @mouseenter="hoverIndex = i"
            @click="choose(opt)"
          >
            <span class="md-menu__item-state" />
            <span class="md-menu__item-label"><slot name="option" :option="opt">{{ opt.label }}</slot></span>
            <MdIcon v-if="opt.value === modelValue" name="check" :size="20" class="md-menu__check" />
          </div>
        </template>
        <div v-else class="md-menu__empty">暂无选项</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.md-select {
  --md-field-height: var(--md-comp-text-field-height);
  --md-field-color: var(--md-sys-color-on-surface-variant);
  --md-field-active: var(--md-sys-color-primary);
  --md-field-outline: var(--md-sys-color-outline);
  --md-field-outline-width: 1px;

  display: flex;
  flex-direction: column;
  min-width: 0;
  outline: none;
  cursor: pointer;
  user-select: none;
}

.is-dense {
  --md-field-height: var(--md-comp-text-field-height-dense);
}

.is-error {
  --md-field-color: var(--md-sys-color-error);
  --md-field-active: var(--md-sys-color-error);
  --md-field-outline: var(--md-sys-color-error);
}

.md-select:hover:not(.is-disabled):not(.is-open):not(:focus-visible) {
  --md-field-outline: var(--md-sys-color-on-surface);
}

.is-open,
.md-select:focus-visible {
  --md-field-outline: var(--md-field-active);
  --md-field-outline-width: 2px;
}

.is-disabled {
  --md-field-outline: color-mix(in srgb, var(--md-sys-color-on-surface) 12%, transparent);
  --md-field-color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);

  cursor: not-allowed;
}

.md-select__container {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: var(--md-field-height);
  padding: 0 var(--md-space-3) 0 var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-extra-small);
}

.md-select__label {
  position: absolute;
  left: var(--md-space-4);
  top: 50%;
  color: var(--md-field-color);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  transform: translateY(-50%);
  transition: all var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  pointer-events: none;
  white-space: nowrap;
}

.is-dense .md-select__label {
  font-size: var(--md-sys-typescale-body-medium-size);
}

.is-open .md-select__label,
.md-select:focus-visible .md-select__label {
  color: var(--md-field-active);
}

.is-floated .md-select__label {
  top: 0;
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
}

.md-select__value {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-body-large-size);
  line-height: var(--md-sys-typescale-body-large-line-height);
  letter-spacing: var(--md-sys-typescale-body-large-tracking);
}

.is-dense .md-select__value {
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
}

.is-disabled .md-select__value {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
}

.md-select__value.is-placeholder {
  color: var(--md-sys-color-on-surface-variant);
  opacity: 0.7;
}

.md-select__arrow {
  color: var(--md-sys-color-on-surface-variant);
  transition: transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-open .md-select__arrow {
  transform: rotate(180deg);
}

.md-select__outline {
  position: absolute;
  inset: 0;
  margin: 0;
  padding: 0 calc(var(--md-space-4) - 4px);
  border: var(--md-field-outline-width) solid var(--md-field-outline);
  border-radius: var(--md-sys-shape-corner-extra-small);
  pointer-events: none;
  transition: border-color var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.md-select__legend {
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

.md-select__legend span {
  padding: 0 4px;
}

.is-floated.has-label .md-select__legend {
  max-width: 100%;
}

.md-select__supporting {
  margin: var(--md-space-1) var(--md-space-4) 0;
  color: var(--md-field-color);
  font-size: var(--md-sys-typescale-body-small-size);
  line-height: var(--md-sys-typescale-body-small-line-height);
}

/* 菜单 */
.md-menu {
  position: fixed;
  z-index: var(--md-z-menu);
  max-height: 300px;
  overflow-y: auto;
  padding: var(--md-space-2) 0;
  background: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-extra-small);
  box-shadow: var(--md-sys-elevation-level2);
}

.md-menu__item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  height: var(--md-comp-menu-item-height);
  padding: 0 var(--md-space-3);
  color: var(--md-sys-color-on-surface);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  white-space: nowrap;
  cursor: pointer;
}

.md-menu.is-dense .md-menu__item {
  height: var(--md-comp-menu-item-height-dense);
}

.md-menu__item-state {
  position: absolute;
  inset: 0;
  background: var(--md-sys-color-on-surface);
  opacity: 0;
  pointer-events: none;
  transition: opacity var(--md-sys-motion-duration-short2) linear;
}

.md-menu__item.is-hover .md-menu__item-state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-menu__item.is-selected {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-menu__item.is-disabled {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
  cursor: not-allowed;
}

.md-menu__item-label {
  position: relative;
  flex: 1;
  min-width: 0;
}

.md-menu__check {
  position: relative;
  color: var(--md-sys-color-on-secondary-container);
}

.md-menu__empty {
  padding: var(--md-space-2) var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-body-medium-size);
  text-align: center;
}

.md-menu-enter-active,
.md-menu-leave-active {
  transition: opacity var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard), transform var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
  transform-origin: top;
}

.md-menu-enter-from,
.md-menu-leave-to {
  opacity: 0;
  transform: scaleY(0.9);
}
</style>
