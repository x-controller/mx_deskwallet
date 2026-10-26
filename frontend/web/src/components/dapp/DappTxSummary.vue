<script setup>
import { computed } from 'vue'
import MxAddress from '@/components/MxAddress.vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import MxTag from '@/components/MxTag.vue'
import { formatAmount } from '@/utils/format'

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

const symbol = computed(() => props.network?.symbol ?? '')
const tokenLabel = (d) => d.token?.symbol ?? '未知 Token'
const amountText = (d) => (d.token ? `${formatAmount(d.amount, d.token.decimals, 6)} ${d.token.symbol}` : `${d.amount.toString()}（原始单位）`)
const knownTarget = computed(() => !!props.decoded?.token)
</script>

<template>
  <div class="tx-summary">
    <p class="tx-summary__row">
      <span class="tx-summary__label">发送方</span>
      <span class="tx-summary__value">
        <span v-if="walletName">{{ walletName }}</span>
        <MxAddress :address="tx.from" :head="8" :tail="6" />
        <MxTag v-if="!walletName" type="danger">不是本钱包的地址</MxTag>
      </span>
    </p>
    <p class="tx-summary__row">
      <span class="tx-summary__label">目标</span>
      <span class="tx-summary__value">
        <MxAddress v-if="tx.to" :address="tx.to" :head="8" :tail="6" />
        <span v-else>部署合约</span>
        <MxTag v-if="knownTarget" type="info">{{ tokenLabel(decoded) }}</MxTag>
        <MxTag v-else-if="tx.data !== '0x'">未知合约</MxTag>
      </span>
    </p>
    <p v-if="tx.value > 0n || !decoded" class="tx-summary__row">
      <span class="tx-summary__label">金额</span>
      <span class="tx-summary__value is-strong">{{ formatAmount(tx.value, 18, 8) }} {{ symbol }}</span>
    </p>

    <template v-if="decoded?.kind === 'transfer'">
      <p class="tx-summary__row">
        <span class="tx-summary__label">操作</span>
        <span class="tx-summary__value is-strong">转出 {{ amountText(decoded) }}</span>
      </p>
      <p class="tx-summary__row">
        <span class="tx-summary__label">收款</span>
        <span class="tx-summary__value"><MxAddress :address="decoded.to" :head="8" :tail="6" /></span>
      </p>
    </template>
    <template v-else-if="decoded?.kind === 'approve'">
      <p class="tx-summary__row">
        <span class="tx-summary__label">操作</span>
        <span class="tx-summary__value is-strong">
          授权 {{ decoded.unlimited ? `无限额度的 ${tokenLabel(decoded)}` : amountText(decoded) }}
          <MxTag v-if="decoded.unlimited" type="danger">无限授权</MxTag>
        </span>
      </p>
      <p class="tx-summary__row">
        <span class="tx-summary__label">被授权</span>
        <span class="tx-summary__value"><MxAddress :address="decoded.spender" :head="8" :tail="6" /></span>
      </p>
    </template>
    <p v-else-if="decoded?.kind === 'call'" class="tx-summary__row">
      <span class="tx-summary__label">调用</span>
      <span class="tx-summary__value">方法 {{ decoded.selector }} · {{ (tx.data.length - 2) / 2 }} 字节数据</span>
    </p>

    <p class="tx-summary__row">
      <span class="tx-summary__label">手续费</span>
      <span class="tx-summary__value">
        <MxSkeleton v-if="estimate.loading" width="90px" />
        <span v-else-if="estimate.error" class="is-error">估算失败，交易可能会回滚：{{ estimate.error }}</span>
        <template v-else>≤ {{ formatAmount(estimate.fee, 18, 8) }} {{ symbol }} · gas {{ estimate.gasLimit }}</template>
      </span>
    </p>
  </div>
</template>

<style scoped>
.tx-summary {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.tx-summary__row {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  margin: 0;
  min-height: var(--mx-size-xs);
}

.tx-summary__label {
  width: 56px;
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
}

.tx-summary__value {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mx-space-xs);
  min-width: 0;
  word-break: break-all;
}

.is-strong {
  font-weight: 600;
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
