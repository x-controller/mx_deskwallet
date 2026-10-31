<script setup>
import { RiCheckboxCircleLine, RiErrorWarningLine, RiInformationLine } from '@remixicon/vue'
import { messages } from '@/utils/message'

const icons = { success: RiCheckboxCircleLine, error: RiErrorWarningLine, info: RiInformationLine }
</script>

<template>
  <Teleport to="body">
    <div class="mx-message">
      <TransitionGroup name="mx-message">
        <div v-for="m in messages" :key="m.id" class="mx-message__item" :class="`is-${m.type}`" role="status">
          <component :is="icons[m.type]" size="16" />
          <span>{{ m.text }}</span>
        </div>
      </TransitionGroup>
    </div>
  </Teleport>
</template>

<style scoped>
.mx-message {
  position: fixed;
  top: var(--mx-space-md);
  left: 50%;
  z-index: var(--mx-z-message);
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: var(--mx-space-sm);
  transform: translateX(-50%);
  pointer-events: none;
}

.mx-message__item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  max-width: 480px;
  padding: var(--mx-space-sm) var(--mx-space-md);
  border-radius: var(--mx-radius-md);
  background: var(--mx-color-surface);
  box-shadow: var(--mx-shadow-float);
  font-size: var(--mx-font-md);
}

.is-success,
.is-info {
  color: var(--mx-color-info);
}

.is-error {
  color: var(--mx-color-danger);
}

.mx-message__item span {
  color: var(--mx-color-text);
}

.mx-message-enter-active,
.mx-message-leave-active {
  transition: opacity var(--mx-transition), transform var(--mx-transition);
}

.mx-message-enter-from,
.mx-message-leave-to {
  opacity: 0;
  transform: translateY(-8px);
}
</style>
