<script setup>
defineProps({
  /** default | info | danger | primary */
  type: { type: String, default: 'default' },
})
</script>

<template>
  <span class="mx-tag" :class="`is-${type}`"><slot /></span>
</template>

<style scoped>
.mx-tag {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
  height: var(--mx-size-tag);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg-hover);
  color: var(--mx-color-text-secondary);
  font-size: var(--mx-font-xs);
  white-space: nowrap;
}

.is-info {
  background: var(--mx-color-info-soft);
  color: var(--mx-color-info);
}

.is-danger {
  background: var(--mx-color-danger-soft);
  color: var(--mx-color-danger);
}

.is-primary {
  background: var(--mx-color-primary);
  color: var(--mx-color-on-primary);
}
</style>
