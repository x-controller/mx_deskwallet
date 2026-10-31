<script setup>
import { RiGlobalLine } from '@remixicon/vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import { useDappPeer } from '@/composables/dapp/useDappPeer'

const props = defineProps({
  /** WalletConnect peer metadata：{ name, url, icons, description } */
  metadata: { type: Object, default: null },
  verifyContext: { type: Object, default: null },
  /** 紧凑模式：单行，用于会话列表 */
  compact: { type: Boolean, default: false },
})

const { icon, verify, host } = useDappPeer(props)
</script>

<template>
  <div class="peer" :class="{ 'is-compact': compact }">
    <img v-if="icon" :src="icon" class="peer__icon" alt="" loading="lazy" />
    <span v-else class="peer__icon peer__icon--empty"><RiGlobalLine size="16" /></span>
    <span class="peer__body">
      <span class="peer__name" :title="metadata?.name">{{ metadata?.name || '未知 dApp' }}</span>
      <span class="peer__host" :title="metadata?.url">{{ host }}</span>
    </span>
    <MxTag v-if="verifyContext" :type="verify.type">{{ verify.text }}</MxTag>
  </div>
</template>

<style scoped>
.peer {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  min-width: 0;
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
}

.is-compact {
  padding: 0;
  background: transparent;
}

.peer__icon {
  width: var(--mx-size-sm);
  height: var(--mx-size-sm);
  flex-shrink: 0;
  border-radius: var(--mx-radius-sm);
  object-fit: cover;
}

.peer__icon--empty {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  background: var(--mx-color-bg-hover);
  color: var(--mx-color-text-secondary);
}

.peer__body {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
}

.is-compact .peer__body {
  flex-direction: row;
  align-items: center;
  gap: var(--mx-space-sm);
}

.peer__name,
.peer__host {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.peer__name {
  font-weight: 600;
}

.peer__host {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
