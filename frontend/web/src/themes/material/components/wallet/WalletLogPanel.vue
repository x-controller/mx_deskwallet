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
  <div ref="panel" class="log-panel md-body-small md-mono">
    <p v-for="l in logs" :key="l.id" class="log-panel__line" :class="`is-${l.type}`">
      <span class="log-panel__name">[{{ l.name }}]</span> {{ l.text }}
    </p>
  </div>
</template>

<style scoped>
.log-panel {
  max-height: 150px;
  overflow-y: auto;
  padding: var(--md-space-2) var(--md-space-3);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}

.log-panel__line {
  margin: 0;
  line-height: 1.7;
  word-break: break-all;
}

.log-panel__name {
  color: var(--md-sys-color-on-surface-variant);
}

.is-success {
  color: var(--md-sys-color-success);
}

.is-error {
  color: var(--md-sys-color-error);
}
</style>
