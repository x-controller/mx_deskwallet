<script setup>
import { ripple as vRipple } from '../ripple'

defineProps({
  active: { type: Boolean, default: false },
  /** 桌面端紧凑高度 40px（规范 56px） */
  dense: { type: Boolean, default: false },
})

const emit = defineEmits(['click'])
</script>

<template>
  <button v-ripple class="md-nav-item" :class="{ 'is-active': active, 'is-dense': dense }" type="button" :aria-current="active ? 'page' : undefined" @click="emit('click', $event)">
    <span class="md-nav-item__state" />
    <span v-if="$slots.icon" class="md-nav-item__icon"><slot name="icon" /></span>
    <span class="md-nav-item__label"><slot /></span>
    <span v-if="$slots.trailing" class="md-nav-item__trailing" @click.stop><slot name="trailing" /></span>
  </button>
</template>

<style scoped>
.md-nav-item {
  position: relative;
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  width: 100%;
  height: var(--md-comp-list-item-height);
  padding: 0 var(--md-space-4) 0 var(--md-space-4);
  overflow: hidden;
  border: none;
  border-radius: var(--md-sys-shape-corner-full);
  background: transparent;
  color: var(--md-sys-color-on-surface-variant);
  font-size: var(--md-sys-typescale-label-large-size);
  line-height: var(--md-sys-typescale-label-large-line-height);
  letter-spacing: var(--md-sys-typescale-label-large-tracking);
  font-weight: var(--md-sys-typescale-weight-medium);
  text-align: left;
  cursor: pointer;
  user-select: none;
  transition: background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.is-dense {
  height: var(--md-comp-list-item-height-dense);
  padding: 0 var(--md-space-3) 0 var(--md-space-4);
}

.is-active {
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-nav-item__state {
  position: absolute;
  inset: 0;
  background: currentColor;
  opacity: 0;
  transition: opacity var(--md-sys-motion-duration-short2) linear;
  pointer-events: none;
}

.md-nav-item:hover .md-nav-item__state {
  opacity: var(--md-sys-state-hover-opacity);
}

.md-nav-item:focus-visible {
  outline: none;
}

.md-nav-item:focus-visible .md-nav-item__state {
  opacity: var(--md-sys-state-focus-opacity);
}

.md-nav-item__icon,
.md-nav-item__label,
.md-nav-item__trailing {
  position: relative;
}

.md-nav-item__icon {
  display: inline-flex;
}

.md-nav-item__label {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.md-nav-item__trailing {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  font-size: var(--md-sys-typescale-label-medium-size);
  font-weight: var(--md-sys-typescale-weight-regular);
}
</style>
