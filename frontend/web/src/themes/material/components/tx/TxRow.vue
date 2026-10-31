<script setup>
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import TxStatusChip from './TxStatusChip.vue'
import { formatTime } from '@/utils/format'
import { useTxRow } from '@/composables/tx/useTxRow'

const props = defineProps({
  /** 交易记录（见 tx store） */
  tx: { type: Object, required: true },
  /** 地址小写 → 钱包名称，用于把自己的地址显示成名字 */
  walletNames: { type: Object, default: () => ({}) },
})

const emit = defineEmits(['remove'])

const { fromName, toName, fromAddress, kindText, amountText, amountOutText, amountTooltip, detail } = useTxRow(props)
</script>

<template>
  <div class="tx-row md-body-medium">
    <TxStatusChip :status="tx.status" :detail="detail" />
    <span class="tx-row__time md-body-small">{{ formatTime(tx.createdAt) }}</span>
    <span><MdChip>{{ kindText }}</MdChip></span>
    <MdTooltip :content="amountTooltip">
      <span class="tx-row__amount">
        <span class="md-mono">{{ amountText }}</span>
        <span class="tx-row__symbol md-label-small">{{ tx.asset.symbol }}</span>
        <template v-if="amountOutText">
          <span class="tx-row__symbol">→</span>
          <span class="md-mono">{{ amountOutText }}</span>
          <span class="tx-row__symbol md-label-small">{{ tx.toAsset.symbol }}</span>
        </template>
      </span>
    </MdTooltip>
    <span class="tx-row__party">
      <span v-if="fromName" class="tx-row__name" :title="fromName">{{ fromName }}</span>
      <MdAddress :address="fromAddress" :head="6" :tail="4" class="tx-row__address" />
    </span>
    <span class="tx-row__party">
      <span v-if="toName" class="tx-row__name" :title="toName">{{ toName }}</span>
      <MdAddress :address="tx.to" :head="6" :tail="4" class="tx-row__address" />
    </span>
    <MdAddress :address="tx.hash" :head="10" :tail="6" label="哈希" class="tx-row__address" />
    <span><MdChip>{{ tx.networkName }}</MdChip></span>
    <span class="tx-row__actions">
      <MdTooltip content="删除记录">
        <MdIconButton size="sm" aria-label="删除记录" @click="emit('remove', tx)"><MdIcon name="delete" /></MdIconButton>
      </MdTooltip>
    </span>
  </div>
</template>

<style scoped>
.tx-row {
  display: grid;
  grid-template-columns: var(--tx-columns);
  align-items: center;
  gap: var(--md-space-2);
  height: 52px;
  padding: 0 var(--md-space-3) 0 var(--md-space-4);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  transition: background var(--md-sys-motion-duration-short2) linear;
}

.tx-row:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.tx-row__time,
.tx-row__symbol {
  color: var(--md-sys-color-on-surface-variant);
}

.tx-row__amount {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.tx-row__party {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  min-width: 0;
}

.tx-row__name {
  max-width: 80px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.tx-row__address {
  font-size: var(--md-sys-typescale-body-small-size);
  color: var(--md-sys-color-on-surface-variant);
}

.tx-row__actions {
  display: inline-flex;
  justify-content: flex-end;
}
</style>
