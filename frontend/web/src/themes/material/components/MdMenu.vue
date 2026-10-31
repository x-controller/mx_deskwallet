<script setup>
import MdIcon from './MdIcon.vue'
import MdIconButton from './MdIconButton.vue'
import MdTooltip from './MdTooltip.vue'
import { useMenu } from '@/composables/ui/useMenu'

const props = defineProps({
  /** [{ key, label, hint?, icon?, disabled?, danger? }]，icon 为 Material Symbols 名称，hint 为 supporting text */
  items: { type: Array, default: () => [] },
  /** 触发按钮的 tooltip，也作 aria-label */
  label: { type: String, default: '' },
  /** 触发按钮的 MdIconButton variant */
  variant: { type: String, default: 'standard' },
  /** 触发按钮的 MdIconButton color */
  color: { type: String, default: 'primary' },
  disabled: { type: Boolean, default: false },
})

const emit = defineEmits(['select'])

/* 根节点是触发器 + Teleport 的片段，class / style 手动落到触发器上 */
defineOptions({ inheritAttrs: false })

const { root, panel, open, hoverIndex, panelStyle, toggle, choose, onKey } = useMenu(props, emit)
</script>

<template>
  <span ref="root" v-bind="$attrs" class="md-menu-anchor" @keydown="onKey">
    <MdTooltip :content="label">
      <MdIconButton :variant="variant" :color="color" :aria-label="label" aria-haspopup="menu" :aria-expanded="open" :selected="open" :disabled="disabled" @click="toggle">
        <slot />
      </MdIconButton>
    </MdTooltip>
  </span>
  <Teleport to="body">
    <Transition name="md-menu">
      <div v-if="open" ref="panel" class="md-menu" :style="panelStyle" role="menu">
        <div
          v-for="(item, i) in items"
          :key="item.key"
          class="md-menu__item"
          :class="{ 'is-hover': i === hoverIndex, 'is-disabled': item.disabled, 'is-danger': item.danger, 'has-hint': item.hint }"
          role="menuitem"
          :aria-disabled="item.disabled || undefined"
          @mouseenter="hoverIndex = i"
          @click="choose(item)"
        >
          <span class="md-menu__item-state" />
          <MdIcon v-if="item.icon" :name="item.icon" :size="24" class="md-menu__item-icon" />
          <span class="md-menu__item-text">
            <span class="md-menu__item-label md-label-large">{{ item.label }}</span>
            <span v-if="item.hint" class="md-menu__item-hint md-body-small">{{ item.hint }}</span>
          </span>
        </div>
      </div>
    </Transition>
  </Teleport>
</template>

<style scoped>
.md-menu-anchor {
  display: inline-flex;
}

.md-menu {
  position: fixed;
  z-index: var(--md-z-menu);
  min-width: 220px;
  max-width: 320px;
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
  min-height: var(--md-comp-menu-item-height);
  padding: var(--md-space-2) var(--md-space-3);
  color: var(--md-sys-color-on-surface);
  cursor: pointer;
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

.md-menu__item-icon {
  position: relative;
  flex-shrink: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.md-menu__item.is-danger .md-menu__item-icon,
.md-menu__item.is-danger .md-menu__item-label {
  color: var(--md-sys-color-error);
}

.md-menu__item-text {
  position: relative;
  display: flex;
  flex-direction: column;
  min-width: 0;
}

.md-menu__item-hint {
  color: var(--md-sys-color-on-surface-variant);
}

.md-menu__item.is-disabled {
  cursor: not-allowed;
}

.md-menu__item.is-disabled .md-menu__item-icon,
.md-menu__item.is-disabled .md-menu__item-label,
.md-menu__item.is-disabled .md-menu__item-hint {
  color: color-mix(in srgb, var(--md-sys-color-on-surface) 38%, transparent);
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
