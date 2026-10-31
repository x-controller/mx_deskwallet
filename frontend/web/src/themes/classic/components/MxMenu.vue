<script setup>
import { RiArrowDownSLine } from '@remixicon/vue'
import MxButton from './MxButton.vue'
import MxTooltip from './MxTooltip.vue'
import { useMenu } from '@/composables/ui/useMenu'

const props = defineProps({
  /** [{ key, label, hint?, disabled?, danger? }]，hint 作为说明文字显示在标签下方 */
  items: { type: Array, default: () => [] },
  /** 触发按钮的 tooltip，也作 aria-label */
  label: { type: String, default: '' },
  /** 触发按钮的 MxButton type */
  type: { type: String, default: 'default' },
  /** 触发按钮的 MxButton size */
  size: { type: String, default: 'sm' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

/* 根节点是触发器 + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { root, panel, open, hoverIndex, panelStyle, toggle, choose, onKey } = useMenu(props, emit)
</script>

<template>
  <span ref="root" v-bind="$attrs" class="mx-menu" :class="{ 'is-open': open }" @keydown="onKey">
    <MxTooltip :content="label">
      <MxButton icon :size="size" :type="type" :aria-label="label" aria-haspopup="menu" :aria-expanded="open" :disabled="disabled" class="mx-menu__trigger" @click="toggle">
        <slot />
        <RiArrowDownSLine class="mx-menu__arrow" size="12" />
      </MxButton>
    </MxTooltip>
  </span>
  <Teleport to="body">
    <Transition name="mx-menu">
      <div v-if="open" ref="panel" class="mx-menu__panel" :style="panelStyle" role="menu">
        <div
          v-for="(item, i) in items"
          :key="item.key"
          class="mx-menu__item"
          :class="{ 'is-hover': i === hoverIndex, 'is-disabled': item.disabled, 'is-danger': item.danger }"
          role="menuitem"
          :aria-disabled="item.disabled || undefined"
          @mouseenter="hoverIndex = i"
          @click="choose(item)"
        >
          <span v-if="$slots.icon" class="mx-menu__icon"><slot name="icon" :item="item" /></span>
          <span class="mx-menu__text">
            <span class="mx-menu__label">{{ item.label }}</span>
            <span v-if="item.hint" class="mx-menu__hint">{{ item.hint }}</span>
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.mx-menu {
  display: inline-flex;
}

.mx-menu__trigger :deep(.mx-button__content) {
  display: inline-flex;
  align-items: center;
  gap: 1px;
}

/* 带下拉箭头的图标按钮比普通图标按钮略宽 */
.mx-menu .mx-menu__trigger.is-icon {
  width: auto;
  padding: 0 var(--mx-space-xs) 0 var(--mx-space-sm);
}

.mx-menu__arrow {
  color: var(--mx-color-text-secondary);
  transition: transform var(--mx-transition);
}

.is-open .mx-menu__arrow {
  transform: rotate(180deg);
}

.mx-menu__panel {
  position: fixed;
  z-index: var(--mx-z-dropdown);
  min-width: 200px;
  max-width: 320px;
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-md);
  box-shadow: var(--mx-shadow-float);
}

.mx-menu__item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
  padding: var(--mx-space-xs) var(--mx-space-sm);
  margin-bottom: var(--mx-space-xxs);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-md);
  cursor: pointer;
  transition: background var(--mx-transition);
}

.mx-menu__item:last-child {
  margin-bottom: 0;
}

.mx-menu__item.is-hover {
  background: var(--mx-color-bg-hover);
}

.mx-menu__item.is-danger .mx-menu__label,
.mx-menu__item.is-danger .mx-menu__icon {
  color: var(--mx-color-danger);
}

.mx-menu__item.is-disabled {
  color: var(--mx-color-text-disabled);
  cursor: not-allowed;
  background: var(--mx-color-bg);
}

.mx-menu__item.is-disabled .mx-menu__label,
.mx-menu__item.is-disabled .mx-menu__icon,
.mx-menu__item.is-disabled .mx-menu__hint {
  color: var(--mx-color-text-disabled);
}

.mx-menu__icon {
  display: inline-flex;
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
}

.mx-menu__text {
  display: flex;
  flex-direction: column;
  min-width: 0;
  line-height: 1.4;
}

.mx-menu__hint {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
  white-space: normal;
}

.mx-menu-enter-active,
.mx-menu-leave-active {
  transition: opacity var(--mx-transition), transform var(--mx-transition);
}

.mx-menu-enter-from,
.mx-menu-leave-to {
  opacity: 0;
  transform: translateY(-4px);
}
</style>
