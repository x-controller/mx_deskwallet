<script setup>
import MdIcon from './MdIcon.vue'

defineProps({
  /** Material Symbols 名称 */
  icon: { type: String, default: 'inbox' },
  text: { type: String, default: '暂无数据' },
})
</script>

<template>
  <div class="md-empty">
    <span class="md-empty__icon"><MdIcon :name="icon" :size="32" /></span>
    <p class="md-empty__text">{{ text }}</p>
    <div v-if="$slots.default" class="md-empty__actions"><slot /></div>
  </div>
</template>

<style scoped>
.md-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--md-space-3);
  padding: var(--md-space-8);
  color: var(--md-sys-color-on-surface-variant);
  text-align: center;
}

.md-empty__icon {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-secondary-container);
  color: var(--md-sys-color-on-secondary-container);
}

.md-empty__text {
  max-width: 420px;
  margin: 0;
  font-size: var(--md-sys-typescale-body-medium-size);
  line-height: var(--md-sys-typescale-body-medium-line-height);
}

.md-empty__actions {
  display: flex;
  flex-wrap: wrap;
  justify-content: center;
  gap: var(--md-space-2);
  margin-top: var(--md-space-1);
}
</style>
