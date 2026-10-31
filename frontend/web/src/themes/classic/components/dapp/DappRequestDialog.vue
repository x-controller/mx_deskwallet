<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
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
  <MxDialog :model-value="true" :title="title" width="600px" :closable="false">
    <div class="request">
      <DappPeerCard :metadata="peer" :verify-context="request.verifyContext" />
      <p class="request__meta">
        <MxTag>{{ method }}</MxTag>
        <MxTag :type="network ? 'info' : 'danger'">{{ network?.name || `Chain ${chainId}` }}</MxTag>
        <span v-if="dapp.pendingCount > 1" class="request__queue">队列中还有 {{ dapp.pendingCount - 1 }} 个请求</span>
      </p>

      <p v-if="blocker" class="request__blocker">{{ blocker }}</p>

      <DappTxSummary v-else-if="kind === 'tx'" :tx="parsed.tx" :decoded="parsed.decoded" :network="network" :wallet-name="wallet?.name ?? ''" :estimate="estimate" />
      <DappSignSummary v-else-if="kind === 'message' || kind === 'typedData'" :kind="kind" :payload="parsed.payload" :wallet-name="wallet?.name ?? ''" />
      <p v-else-if="kind === 'switchChain'" class="request__text">dApp 请求把当前网络切换到 <strong>{{ parsed.targetNetwork.name }}</strong>（Chain {{ parsed.targetChain }}）。</p>

      <p v-if="isEthSign" class="request__warn">eth_sign 是过时的签名方式，签名内容可能被用于构造交易，除非完全信任该 dApp，请拒绝。</p>
      <p v-if="isSignOnlyTx" class="request__warn">dApp 只请求签名，不会由本钱包广播；签好的交易将返回给 dApp 自行发送。</p>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="submitting" @click="reject">拒绝</MxButton>
      <MxButton v-if="!blocker" size="sm" type="primary" :loading="submitting" @click="approve">{{ approveText }}</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.request {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.request__meta {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  margin: 0;
}

.request__queue {
  margin-left: auto;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.request__blocker,
.request__warn {
  margin: 0;
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-danger-soft);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
  line-height: 1.5;
}

.request__text {
  margin: 0;
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}
</style>
