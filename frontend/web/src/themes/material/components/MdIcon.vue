<script setup>
import { computed } from 'vue'
import { icons } from '../icons'

const props = defineProps({
  /** Material Symbols 名称，见 themes/material/icons.js */
  name: { type: String, required: true },
  size: { type: [Number, String], default: 24 },
})

const svg = computed(() => icons[props.name] ?? '')
</script>

<template>
  <span class="md-icon" :style="{ '--md-icon-size': `${size}px` }" aria-hidden="true" v-html="svg" />
</template>

<style scoped>
.md-icon {
  display: inline-flex;
  flex-shrink: 0;
  width: var(--md-icon-size);
  height: var(--md-icon-size);
  vertical-align: middle;
}

.md-icon :deep(svg) {
  width: 100%;
  height: 100%;
  fill: currentColor;
}
</style>
