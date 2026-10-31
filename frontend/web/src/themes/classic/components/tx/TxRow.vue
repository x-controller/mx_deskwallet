<script setup>
import { RiDeleteBinLine } from '@remixicon/vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import TxStatusTag from './TxStatusTag.vue'
import { formatTime } from '@/utils/format'
import { useTxRow } from '@/composables/tx/useTxRow'

const props = defineProps({
  /** 交易记录（见 tx store） */
  tx: { type: Object, required: true },
  /** 地址小写 → 钱包名称，用于把自己的地址显示成名字 */
  walletNames: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['remove'])

const { fromName, toName, kindText, amountText, amountOutText, amountTooltip, detail } = useTxRow(props)
</script>

<template>
  <div class="tx-row" :class="`is-${tx.status}`">
    <TxStatusTag :status="tx.status" :detail="detail" />
    <span class="tx-row__time">{{ formatTime(tx.createdAt) }}</span>
    <span><MxTag>{{ kindText }}</MxTag></span>
    <MxTooltip :content="amountTooltip">
      <span class="tx-row__amount">
        {{ amountText }}
        <span class="tx-row__symbol">{{ tx.asset.symbol }}</span>
        <template v-if="amountOutText">
          <span class="tx-row__symbol">→</span>
          {{ amountOutText }}
          <span class="tx-row__symbol">{{ tx.toAsset.symbol }}</span>
        </template>
      </span>
    </MxTooltip>
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
