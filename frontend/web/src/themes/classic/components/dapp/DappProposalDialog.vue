<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxCheckbox from '@/themes/classic/components/MxCheckbox.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
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
  <MxDialog :model-value="true" title="dApp 请求连接" width="560px" :closable="false">
    <div class="proposal">
      <DappPeerCard :metadata="metadata" :verify-context="proposal.verifyContext" />
      <p v-if="isScam" class="proposal__danger">该域名被标记为钓鱼站点，强烈建议拒绝。</p>

      <section class="proposal__section">
        <h3 class="proposal__heading">暴露给 dApp 的钱包</h3>
        <div class="proposal__list">
          <label v-for="w in walletStore.signableWallets" :key="w.id" class="proposal__item" :class="{ 'is-checked': selectedWallets.has(w.id) }">
            <MxCheckbox :model-value="selectedWallets.has(w.id)" @change="toggleWallet(w.id, $event)">
              <span class="proposal__name">{{ w.name }}</span>
            </MxCheckbox>
            <span class="proposal__address">{{ shortAddress(w.address, 8, 6) }}</span>
          </label>
        </div>
      </section>

      <section class="proposal__section">
        <h3 class="proposal__heading">网络</h3>
        <p v-if="missingRequired.length" class="proposal__danger">dApp 要求的链未配置：{{ missingRequired.map((c) => `Chain ${c}`).join('、') }}，请先在「配置 RPC」中添加后重试。</p>
        <div class="proposal__list">
          <label v-for="c in chainChoices" :key="c" class="proposal__item" :class="{ 'is-checked': selectedChains.has(c) }">
            <MxCheckbox :model-value="selectedChains.has(c)" :disabled="!knownChain(c) || requiredChains.includes(c)" @change="toggleChain(c, $event)">
              <span class="proposal__name">{{ networkName(c) }}</span>
            </MxCheckbox>
            <MxTag v-if="requiredChains.includes(c)" type="info">必需</MxTag>
            <MxTag v-else-if="!knownChain(c)" type="danger">未配置</MxTag>
          </label>
        </div>
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="submitting" @click="reject">拒绝</MxButton>
      <MxButton size="sm" type="primary" :disabled="!canApprove" :loading="submitting" @click="approve">连接</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.proposal {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-md);
}

.proposal__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.proposal__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}

.proposal__list {
  display: flex;
  flex-direction: column;
  max-height: 180px;
  overflow-y: auto;
}

.proposal__item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-sm);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  cursor: pointer;
  transition: background var(--mx-transition);
}

.proposal__item:hover {
  background: var(--mx-color-bg-hover);
}

.proposal__item.is-checked {
  background: var(--mx-color-bg-active);
}

.proposal__name {
  font-size: var(--mx-font-sm);
}

.proposal__address {
  margin-left: auto;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.proposal__danger {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
}
</style>
