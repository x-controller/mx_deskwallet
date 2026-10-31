<script setup>
import { ref } from 'vue'
import MdIcon from './MdIcon.vue'
import MdIconButton from './MdIconButton.vue'

defineProps({
  modelValue: { type: String, default: '' },
  placeholder: { type: String, default: '搜索' },
})

const emit = defineEmits(['update:modelValue'])
const native = ref(null)
</script>

<template>
  <div class="md-search" role="search" @click="native?.focus()">
    <MdIcon name="search" :size="20" class="md-search__icon" />
    <input ref="native" class="md-search__input" type="search" :value="modelValue" :placeholder="placeholder" spellcheck="false" @input="emit('update:modelValue', $event.target.value)" />
    <MdIconButton v-if="modelValue" size="sm" aria-label="清除搜索" @click.stop="emit('update:modelValue', '')">
      <MdIcon name="close" />
    </MdIconButton>
  </div>
</template>

<style scoped>
.md-search {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: var(--md-comp-button-height);
  padding: 0 var(--md-space-1) 0 var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-high);
  color: var(--md-sys-color-on-surface);
  cursor: text;
  transition: background var(--md-sys-motion-duration-short4) var(--md-sys-motion-easing-standard);
}

.md-search:hover,
.md-search:focus-within {
  background: var(--md-sys-color-surface-container-highest);
}

.md-search__icon {
  color: var(--md-sys-color-on-surface-variant);
}

.md-search__input {
  flex: 1;
  min-width: 0;
  padding: 0;
  border: none;
  outline: none;
  background: transparent;
  font-size: var(--md-sys-typescale-body-medium-size);
  letter-spacing: var(--md-sys-typescale-body-medium-tracking);
  color: inherit;
}

.md-search__input::placeholder {
  color: var(--md-sys-color-on-surface-variant);
}

.md-search__input::-webkit-search-cancel-button {
  display: none;
}
</style>
