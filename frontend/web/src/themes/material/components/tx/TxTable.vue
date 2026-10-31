<script setup>
import MdEmpty from '@/themes/material/components/MdEmpty.vue'
import MdPagination from '@/themes/material/components/MdPagination.vue'
import TxRow from './TxRow.vue'
import { useTxTable } from '@/composables/tx/useTxTable'

const props = defineProps({
  /** 已按关键字 / 分组过滤后的记录 */
  txs: { type: Array, default: () => [] },
  /** 是否因为筛选导致为空（区分“没有记录”和“没有匹配”） */
  filtered: { type: Boolean, default: false },
})

const { page, pageSize, walletNames, paged, remove } = useTxTable(props)
</script>

<template>
  <section class="tx-table">
    <div class="tx-table__head md-label-medium">
      <span>状态</span>
      <span>时间</span>
      <span>类型</span>
      <span>金额</span>
      <span>发送方</span>
      <span>接收方</span>
      <span>哈希</span>
      <span>网络</span>
      <span class="is-right">操作</span>
    </div>

    <template v-if="txs.length">
      <div class="tx-table__body">
        <TxRow v-for="t in paged" :key="t.id" :tx="t" :wallet-names="walletNames" @remove="remove" />
      </div>
      <MdPagination v-model:page="page" v-model:page-size="pageSize" :total="txs.length" class="tx-table__pagination" />
    </template>

    <div v-else class="tx-table__empty">
      <MdEmpty icon="receipt_long" :text="filtered ? '没有匹配的交易记录' : '还没有交易记录，转账或一键清空后会出现在这里'" />
    </div>
  </section>
</template>

<style scoped>
.tx-table {
  --tx-columns: 88px 150px 56px minmax(110px, 1fr) minmax(150px, 1.1fr) minmax(150px, 1.1fr) minmax(170px, 1.2fr) 96px 48px;

  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.tx-table__head {
  display: grid;
  grid-template-columns: var(--tx-columns);
  align-items: center;
  gap: var(--md-space-2);
  height: 44px;
  padding: 0 var(--md-space-3) 0 var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.tx-table__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.tx-table__pagination {
  padding: var(--md-space-2) var(--md-space-3);
  border-top: 1px solid var(--md-sys-color-outline-variant);
}

.is-right {
  text-align: right;
}

.tx-table__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
