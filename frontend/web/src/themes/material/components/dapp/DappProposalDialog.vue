<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdCheckbox from '@/themes/material/components/MdCheckbox.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import DappPeerCard from './DappPeerCard.vue'
import { shortAddress } from '@/utils/format'
import { useDappProposal } from '@/composables/dapp/useDappProposal'

const props = defineProps({
  /** 队首的连接请求 { id, params, verifyContext } */
  proposal: { type: Object, required: true },
})

const { walletStore, selectedWallets, selectedChains, submitting, metadata, requiredChains, knownChain, networkName, missingRequired, isScam, chainChoices, canApprove, toggleWallet, toggleChain, approve, reject } = useDappProposal(props)
</script>

<template>
  <MdDialog :model-value="true" title="dApp 请求连接" icon="link" width="560px" :closable="false">
    <div class="proposal">
      <DappPeerCard :metadata="metadata" :verify-context="proposal.verifyContext" />
      <p v-if="isScam" class="proposal__danger md-body-small">该域名被标记为钓鱼站点，强烈建议拒绝。</p>

      <section class="proposal__section">
        <h3 class="proposal__heading md-title-small">暴露给 dApp 的钱包</h3>
        <div class="proposal__list">
          <label v-for="w in walletStore.signableWallets" :key="w.id" class="proposal__item" :class="{ 'is-checked': selectedWallets.has(w.id) }">
            <MdCheckbox :model-value="selectedWallets.has(w.id)" @change="toggleWallet(w.id, $event)">
              <span class="md-body-medium">{{ w.name }}</span>
            </MdCheckbox>
            <span class="proposal__address md-body-small md-mono">{{ shortAddress(w.address, 8, 6) }}</span>
          </label>
        </div>
      </section>

      <section class="proposal__section">
        <h3 class="proposal__heading md-title-small">网络</h3>
        <p v-if="missingRequired.length" class="proposal__danger md-body-small">dApp 要求的链未配置：{{ missingRequired.map((c) => `Chain ${c}`).join('、') }}，请先在「配置 RPC」中添加后重试。</p>
        <div class="proposal__list">
          <label v-for="c in chainChoices" :key="c" class="proposal__item" :class="{ 'is-checked': selectedChains.has(c) }">
            <MdCheckbox :model-value="selectedChains.has(c)" :disabled="!knownChain(c) || requiredChains.includes(c)" @change="toggleChain(c, $event)">
              <span class="md-body-medium">{{ networkName(c) }}</span>
            </MdCheckbox>
            <MdChip v-if="requiredChains.includes(c)" tone="primary">必需</MdChip>
            <MdChip v-else-if="!knownChain(c)" tone="error">未配置</MdChip>
          </label>
        </div>
      </section>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="submitting" @click="reject">拒绝</MdButton>
      <MdButton :disabled="!canApprove" :loading="submitting" @click="approve">连接</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.proposal {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
}

.proposal__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.proposal__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.proposal__list {
  display: flex;
  flex-direction: column;
  max-height: 200px;
  overflow-y: auto;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.proposal__item {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: 44px;
  padding: 0 var(--md-space-3) 0 var(--md-space-1);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  cursor: pointer;
  transition: background var(--md-sys-motion-duration-short2) linear;
}

.proposal__item:last-child {
  border-bottom: none;
}

.proposal__item:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.proposal__address {
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
}

.proposal__danger {
  margin: 0;
  padding: var(--md-space-2) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}
</style>
