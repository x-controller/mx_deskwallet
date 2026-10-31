<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import DappPeerCard from './DappPeerCard.vue'
import DappTxSummary from './DappTxSummary.vue'
import DappSignSummary from './DappSignSummary.vue'
import { useDappRequest } from '@/composables/dapp/useDappRequest'

const props = defineProps({
  /** 队首的会话请求 { id, topic, params: { request: { method, params }, chainId }, verifyContext } */
  request: { type: Object, required: true },
})

const { dapp, submitting, estimate, method, kind, peer, chainId, network, title, parsed, wallet, blocker, approveText, isEthSign, isSignOnlyTx, approve, reject } = useDappRequest(props)
</script>

<template>
  <MdDialog :model-value="true" :title="title" width="600px" :closable="false">
    <div class="request">
      <DappPeerCard :metadata="peer" :verify-context="request.verifyContext" />
      <p class="request__meta">
        <MdChip outlined>{{ method }}</MdChip>
        <MdChip :tone="network ? 'secondary' : 'error'">{{ network?.name || `Chain ${chainId}` }}</MdChip>
        <span v-if="dapp.pendingCount > 1" class="request__queue md-body-small">队列中还有 {{ dapp.pendingCount - 1 }} 个请求</span>
      </p>

      <p v-if="blocker" class="request__blocker md-body-small">{{ blocker }}</p>

      <DappTxSummary v-else-if="kind === 'tx'" :tx="parsed.tx" :decoded="parsed.decoded" :network="network" :wallet-name="wallet?.name ?? ''" :estimate="estimate" />
      <DappSignSummary v-else-if="kind === 'message' || kind === 'typedData'" :kind="kind" :payload="parsed.payload" :wallet-name="wallet?.name ?? ''" />
      <p v-else-if="kind === 'switchChain'" class="request__text md-body-medium">dApp 请求把当前网络切换到 <strong>{{ parsed.targetNetwork.name }}</strong>（Chain {{ parsed.targetChain }}）。</p>

      <p v-if="isEthSign" class="request__blocker md-body-small">eth_sign 是过时的签名方式，签名内容可能被用于构造交易，除非完全信任该 dApp，请拒绝。</p>
      <p v-if="isSignOnlyTx" class="request__blocker md-body-small">dApp 只请求签名，不会由本钱包广播；签好的交易将返回给 dApp 自行发送。</p>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="submitting" @click="reject">拒绝</MdButton>
      <MdButton v-if="!blocker" :loading="submitting" @click="approve">{{ approveText }}</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.request {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-3);
}

.request__meta {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  margin: 0;
}

.request__queue {
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
}

.request__blocker {
  margin: 0;
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-error-container);
  color: var(--md-sys-color-on-error-container);
}

.request__text {
  margin: 0;
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface);
}
</style>
