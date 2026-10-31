<script setup>
import { nextTick, ref, watch } from 'vue'

const props = defineProps({
  /** [{ id, name, type: info | success | error, text }] */
  logs: { type: Array, default: () => [] },
})

const panel = ref(null)

/* 新日志进来时滚到底部 */
watch(
  () => props.logs.length,
  () => nextTick(() => {
    if (panel.value) panel.value.scrollTop = panel.value.scrollHeight
  }),
)
</script>

<template>
  <div ref="panel" class="log-panel">
    <p v-for="l in logs" :key="l.id" class="log-panel__line" :class="`is-${l.type}`">
      <span class="log-panel__name">[{{ l.name }}]</span> {{ l.text }}
    </p>
  </div>
</template>

<style scoped>
.log-panel {
  max-height: 140px;
  overflow-y: auto;
  padding: var(--mx-space-xs) var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.log-panel__line {
  margin: 0;
  line-height: 1.6;
  word-break: break-all;
}

.log-panel__name {
  color: var(--mx-color-text-secondary);
}

.is-success {
  color: var(--mx-color-info);
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
