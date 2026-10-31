<script setup>
defineProps({
  width: { type: String, default: '100%' },
  height: { type: String, default: '16px' },
})
</script>

<template>
  <span class="md-skeleton" :style="{ width, height }" aria-busy="true" />
</template>

<style scoped>
.md-skeleton {
  display: inline-block;
  border-radius: var(--md-sys-shape-corner-extra-small);
  background: linear-gradient(90deg, var(--md-sys-color-surface-container-highest) 25%, var(--md-sys-color-surface-container-high) 50%, var(--md-sys-color-surface-container-highest) 75%);
  background-size: 200% 100%;
  animation: md-shimmer 1.4s var(--md-sys-motion-easing-standard) infinite;
}

@keyframes md-shimmer {
  from {
    background-position: 200% 0;
  }

  to {
    background-position: -200% 0;
  }
}
</style>
