<script setup>
import { RiArrowDownSLine, RiCheckLine } from '@remixicon/vue'
import { useSelect } from '@/composables/ui/useSelect'

const props = defineProps({
  modelValue: { type: [String, Number, null], default: null },
  /** [{ label, value, disabled? }] */
  options: { type: Array, default: () => [] },
  placeholder: { type: String, default: '请选择' },
  /** sm | md | lg */
  size: { type: String, default: 'md' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'change'])

/* 根节点是 div + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { root, panel, open, hoverIndex, panelStyle, selected, toggle, choose, onKey } = useSelect(props, emit)
</script>

<template>
  <div
    ref="root"
    v-bind="$attrs"
    class="mx-select"
    :class="[`is-${size}`, { 'is-open': open, 'is-disabled': disabled }]"
    :tabindex="disabled ? -1 : 0"
    role="combobox"
    :aria-expanded="open"
    @click="toggle"
    @keydown="onKey"
  >
    <span class="mx-select__label" :class="{ 'is-placeholder': !selected }">
      <slot name="label" :option="selected">{{ selected ? selected.label : placeholder }}</slot>
    </span>
    <RiArrowDownSLine class="mx-select__arrow" size="16" />
  </div>
  <Teleport to="body">
    <Transition name="mx-select">
      <div v-if="open" ref="panel" class="mx-select__panel" :style="panelStyle" role="listbox">
        <template v-if="options.length">
          <div
            v-for="(opt, i) in options"
            :key="opt.value"
            class="mx-select__option"
            :class="{ 'is-selected': opt.value === modelValue, 'is-hover': i === hoverIndex, 'is-disabled': opt.disabled }"
            role="option"
            :aria-selected="opt.value === modelValue"
            @mouseenter="hoverIndex = i"
            @click="choose(opt)"
          >
            <span class="mx-select__option-label"><slot name="option" :option="opt">{{ opt.label }}</slot></span>
            <RiCheckLine v-if="opt.value === modelValue" size="14" />
          </div>
        </template>
        <div v-else class="mx-select__empty">暂无选项</div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mx-select {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
  min-width: 0;
  padding: 0 var(--mx-space-sm);
  background: var(--mx-color-bg);
  border-radius: var(--mx-radius-md);
  cursor: pointer;
  user-select: none;
  outline: none;
  transition: background var(--mx-transition);
}

.mx-select:hover,
.mx-select.is-open {
  background: var(--mx-color-bg-hover);
}

.mx-select:focus-visible {
  outline: 2px solid var(--mx-btn-group-focus-ring);
  outline-offset: 1px;
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

.is-disabled {
  opacity: 0.6;
  cursor: not-allowed;
}

.mx-select__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-placeholder {
  color: var(--mx-color-text-disabled);
}

.mx-select__arrow {
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
  transition: transform var(--mx-transition);
}

.is-open .mx-select__arrow {
  transform: rotate(180deg);
}

.mx-select__panel {
  position: fixed;
  z-index: var(--mx-z-dropdown);
  max-height: 260px;
  overflow-y: auto;
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-md);
  box-shadow: var(--mx-shadow-float);
}

.mx-select__option {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-sm);
  padding: 0 var(--mx-space-sm);
  margin-bottom: var(--mx-space-xxs);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-md);
  cursor: pointer;
  white-space: nowrap;
  transition: background var(--mx-transition);
}

.mx-select__option:last-child {
  margin-bottom: 0;
}

.mx-select__option-label {
  flex: 1;
}

.mx-select__option.is-hover {
  background: var(--mx-color-bg-hover);
}

.mx-select__option.is-selected {
  background: var(--mx-color-bg-active);
}

.mx-select__option.is-disabled {
  color: var(--mx-color-text-disabled);
  cursor: not-allowed;
  background: var(--mx-color-bg);
}

.mx-select__empty {
  padding: var(--mx-space-sm) var(--mx-space-md);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
  text-align: center;
}

.mx-select-enter-active,
.mx-select-leave-active {
  transition: opacity var(--mx-transition), transform var(--mx-transition);
}

.mx-select-enter-from,
.mx-select-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
