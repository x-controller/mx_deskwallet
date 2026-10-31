<script setup>
defineProps({
  size: { type: Number, default: 14 },
})
</script>

<template>
  <span class="mx-spinner" :style="{ width: `${size}px`, height: `${size}px` }" aria-label="加载中" />
</template>

<style scoped>
.mx-spinner {
  display: inline-block;
  flex-shrink: 0;
  border: 2px solid currentColor;
  border-right-color: transparent;
  border-radius: var(--mx-radius-full);
  animation: mx-spin 0.8s linear infinite;
}

@keyframes mx-spin {
  to {
    transform: rotate(360deg);
  }
}
</style>
