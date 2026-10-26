<script setup>
import { computed } from 'vue'
import { RiDeleteBinLine } from '@remixicon/vue'
import MxAddress from '@/components/MxAddress.vue'
import MxButton from '@/components/MxButton.vue'
import MxTag from '@/components/MxTag.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import TxStatusTag from './TxStatusTag.vue'
import { formatAmount, formatTime } from '@/utils/format'

const props = defineProps({
  /** 交易记录（见 tx store） */
  tx: { type: Object, required: true },
  /** 地址小写 → 钱包名称，用于把自己的地址显示成名字 */
  walletNames: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['remove'])

const KIND = { transfer: '转账', drain: '清空' }

const fromName = computed(() => props.walletNames[props.tx.from.toLowerCase()] || '')
const toName = computed(() => props.walletNames[props.tx.to.toLowerCase()] || '')

const detail = computed(() => {
  const t = props.tx
  const lines = []
  if (t.fee) lines.push(`手续费 ${formatAmount(t.fee, 18, 8)} ${t.nativeSymbol}`)
  if (t.blockNumber) lines.push(`区块 ${t.blockNumber}`)
  if (t.settledAt) lines.push(`确认于 ${formatTime(t.settledAt)}`)
  if (t.error) lines.push(t.error)
  return lines.join('\n')
})
</script>

<template>
  <div class="tx-row" :class="`is-${tx.status}`">
    <TxStatusTag :status="tx.status" :detail="detail" />
    <span class="tx-row__time">{{ formatTime(tx.createdAt) }}</span>
    <span><MxTag>{{ KIND[tx.kind] || tx.kind }}</MxTag></span>
    <span class="tx-row__amount">
      {{ formatAmount(tx.amount, tx.asset.decimals, 6) }}
      <span class="tx-row__symbol">{{ tx.asset.symbol }}</span>
    </span>
    <span class="tx-row__party">
      <span v-if="fromName" class="tx-row__name" :title="fromName">{{ fromName }}</span>
      <MxAddress :address="tx.from" :head="6" :tail="4" />
    </span>
    <span class="tx-row__party">
      <span v-if="toName" class="tx-row__name" :title="toName">{{ toName }}</span>
      <MxAddress :address="tx.to" :head="6" :tail="4" />
    </span>
    <MxAddress :address="tx.hash" :head="10" :tail="6" label="哈希" />
    <span><MxTag>{{ tx.networkName }}</MxTag></span>
    <span class="tx-row__actions">
      <MxTooltip content="删除记录">
        <MxButton icon size="xs" type="surface" aria-label="删除记录" @click="emit('remove', tx)"><RiDeleteBinLine size="14" /></MxButton>
      </MxTooltip>
    </span>
  </div>
</template>

<style scoped>
.tx-row {
  display: grid;
  grid-template-columns: var(--tx-columns);
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-md);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  transition: background var(--mx-transition);
}

.tx-row:hover {
  background: var(--mx-color-bg-hover);
}

.tx-row__time,
.tx-row__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.tx-row__amount {
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-row__party {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
  min-width: 0;
}

.tx-row__name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-row__name + :deep(.mx-address) {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.tx-row__actions {
  display: inline-flex;
  justify-content: flex-end;
}
</style>
