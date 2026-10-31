<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdEmpty from '@/themes/material/components/MdEmpty.vue'
import DappPeerCard from './DappPeerCard.vue'
import { sessionAccounts, sessionChains } from '@/composables/dapp/useDappPeer'

defineProps({
  /** WalletConnect 活跃会话列表 */
  sessions: { type: Array, default: () => [] },
  /** chainId → 网络名 */
  networkNames: { type: Object, default: () => ({}) },
  /** 正在断开的 topic */
  disconnecting: { type: String, default: '' },
})

const emit = defineEmits(['disconnect'])
</script>

<template>
  <div class="session-list">
    <template v-if="sessions.length">
      <div v-for="s in sessions" :key="s.topic" class="session-item md-body-small">
        <DappPeerCard :metadata="s.peer?.metadata" compact class="session-item__peer" />
        <span class="session-item__meta">{{ sessionAccounts(s).size }} 个钱包</span>
        <span class="session-item__chains">
          <MdChip v-for="c in sessionChains(s)" :key="c">{{ networkNames[c] || `Chain ${c}` }}</MdChip>
        </span>
        <MdTooltip content="断开连接">
          <MdIconButton size="sm" aria-label="断开连接" :loading="disconnecting === s.topic" @click="emit('disconnect', s.topic)"><MdIcon name="link_off" /></MdIconButton>
        </MdTooltip>
      </div>
    </template>
    <MdEmpty v-else icon="power" text="还没有连接的 dApp，粘贴 wc: 连接串开始" />
  </div>
</template>

<style scoped>
.session-list {
  display: flex;
  flex-direction: column;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  overflow: hidden;
}

.session-item {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  height: 52px;
  padding: 0 var(--md-space-2) 0 var(--md-space-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.session-item:last-child {
  border-bottom: none;
}

.session-item__peer {
  flex: 1;
  min-width: 0;
}

.session-item__meta {
  color: var(--md-sys-color-on-surface-variant);
  white-space: nowrap;
}

.session-item__chains {
  display: inline-flex;
  gap: var(--md-space-1);
  max-width: 240px;
  overflow: hidden;
}
</style>
