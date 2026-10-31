<script setup>
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
import { useDappTxSummary } from '@/composables/dapp/useDappSummary'

const props = defineProps({
  /** parseTxRequest 的结果 */
  tx: { type: Object, required: true },
  /** decodeTxData 的结果 */
  decoded: { type: Object, default: null },
  network: { type: Object, default: null },
  /** 发送方钱包名；为空表示不是我们的钱包 */
  walletName: { type: String, default: '' },
  /** { loading, gasLimit, fee, error } */
  estimate: { type: Object, default: () => ({ loading: true }) },
})

const { tokenLabel, amountText, knownTarget, valueText, showValue, dataBytes, feeText } = useDappTxSummary(props)
</script>

<template>
  <div class="tx-summary">
    <MdKeyValue label="发送方">
      <span v-if="walletName">{{ walletName }}</span>
      <MdAddress :address="tx.from" :head="8" :tail="6" />
      <MdChip v-if="!walletName" tone="error">不是本钱包的地址</MdChip>
    </MdKeyValue>
    <MdKeyValue label="目标">
      <MdAddress v-if="tx.to" :address="tx.to" :head="8" :tail="6" />
      <span v-else>部署合约</span>
      <MdChip v-if="knownTarget" tone="secondary">{{ tokenLabel(decoded) }}</MdChip>
      <MdChip v-else-if="tx.data !== '0x'" tone="warning">未知合约</MdChip>
    </MdKeyValue>
    <MdKeyValue v-if="showValue" label="金额"><span class="is-strong">{{ valueText }}</span></MdKeyValue>

    <template v-if="decoded?.kind === 'transfer'">
      <MdKeyValue label="操作"><span class="is-strong">转出 {{ amountText(decoded) }}</span></MdKeyValue>
      <MdKeyValue label="收款"><MdAddress :address="decoded.to" :head="8" :tail="6" /></MdKeyValue>
    </template>
    <template v-else-if="decoded?.kind === 'approve'">
      <MdKeyValue label="操作">
        <span class="is-strong">授权 {{ decoded.unlimited ? `无限额度的 ${tokenLabel(decoded)}` : amountText(decoded) }}</span>
        <MdChip v-if="decoded.unlimited" tone="error">无限授权</MdChip>
      </MdKeyValue>
      <MdKeyValue label="被授权"><MdAddress :address="decoded.spender" :head="8" :tail="6" /></MdKeyValue>
    </template>
    <MdKeyValue v-else-if="decoded?.kind === 'call'" label="调用">方法 {{ decoded.selector }} · {{ dataBytes }} 字节数据</MdKeyValue>

    <MdKeyValue label="手续费">
      <MdSkeleton v-if="estimate.loading" width="90px" />
      <span v-else-if="estimate.error" class="md-error-text">估算失败，交易可能会回滚：{{ estimate.error }}</span>
      <template v-else>{{ feeText }}</template>
    </MdKeyValue>
  </div>
</template>

<style scoped>
.tx-summary {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.is-strong {
  font-weight: var(--md-sys-typescale-weight-medium);
}
</style>
