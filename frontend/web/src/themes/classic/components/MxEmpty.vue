<script setup>
import { RiInboxLine } from '@remixicon/vue'

defineProps({
  icon: { type: [Object, Function], default: RiInboxLine },
  text: { type: String, default: '暂无数据' },
})
</script>

<template>
  <div class="mx-empty">
    <component :is="icon" size="36" class="mx-empty__icon" />
    <p class="mx-empty__text">{{ text }}</p>
    <div v-if="$slots.default" class="mx-empty__extra"><slot /></div>
  </div>
</template>

<style scoped>
.mx-empty {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  gap: var(--mx-space-sm);
  padding: var(--mx-space-lg);
  color: var(--mx-color-text-secondary);
}

.mx-empty__icon {
  color: var(--mx-color-text-disabled);
}

.mx-empty__text {
  margin: 0;
  font-size: var(--mx-font-sm);
}

.mx-empty__extra {
  display: flex;
  gap: var(--mx-space-sm);
}
</style>
