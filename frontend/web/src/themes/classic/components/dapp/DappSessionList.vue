<script setup>
import { RiLinkUnlinkM, RiPlugLine } from '@remixicon/vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxEmpty from '@/themes/classic/components/MxEmpty.vue'
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
      <div v-for="s in sessions" :key="s.topic" class="session-item">
        <DappPeerCard :metadata="s.peer?.metadata" compact class="session-item__peer" />
        <span class="session-item__meta">{{ sessionAccounts(s).size }} 个钱包</span>
        <span class="session-item__chains">
          <MxTag v-for="c in sessionChains(s)" :key="c">{{ networkNames[c] || `Chain ${c}` }}</MxTag>
        </span>
        <MxTooltip content="断开连接">
          <MxButton icon size="xs" type="surface" aria-label="断开连接" :loading="disconnecting === s.topic" @click="emit('disconnect', s.topic)"><RiLinkUnlinkM size="14" /></MxButton>
        </MxTooltip>
      </div>
    </template>
    <MxEmpty v-else :icon="RiPlugLine" text="还没有连接的 dApp，粘贴 wc: 连接串开始" />
  </div>
</template>

<style scoped>
.session-list {
  display: flex;
  flex-direction: column;
}

.session-item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-md);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-xs) 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.session-item__peer {
  flex: 1;
  min-width: 0;
}

.session-item__meta {
  color: var(--mx-color-text-secondary);
  white-space: nowrap;
}

.session-item__chains {
  display: inline-flex;
  gap: var(--mx-space-xxs);
  max-width: 220px;
  overflow: hidden;
}
</style>
