<script setup>
defineProps({
  label: { type: String, default: '' },
  /** 标签列宽 */
  labelWidth: { type: String, default: '64px' },
})
</script>

<template>
  <div class="md-kv">
    <span class="md-kv__label md-body-small" :style="{ width: labelWidth }">{{ label }}</span>
    <span class="md-kv__value md-body-medium"><slot /></span>
  </div>
</template>

<style scoped>
.md-kv {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-3);
  min-height: 24px;
}

.md-kv__label {
  flex-shrink: 0;
  padding-top: 2px;
  color: var(--md-sys-color-on-surface-variant);
}

.md-kv__value {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--md-space-1);
  flex: 1;
  min-width: 0;
  color: var(--md-sys-color-on-surface);
  word-break: break-all;
}
</style>
