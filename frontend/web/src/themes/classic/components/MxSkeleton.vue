<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '14px' },
})
</script>

<template>
  <span class="mx-skeleton" :style="{ width, height }" aria-busy="true" />
</template>

<style scoped>
.mx-skeleton {
  display: inline-block;
  border-radius: var(--mx-radius-sm);
  background: linear-gradient(90deg, var(--mx-color-bg-hover) 25%, var(--mx-color-bg-active) 50%, var(--mx-color-bg-hover) 75%);
  background-size: 200% 100%;
  animation: mx-shimmer 1.2s ease-in-out infinite;
}

@keyframes mx-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
