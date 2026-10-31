<script setup>
import { RiHistoryLine } from '@remixicon/vue'
import MxEmpty from '@/themes/classic/components/MxEmpty.vue'
import MxPagination from '@/themes/classic/components/MxPagination.vue'
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
    <div class="tx-table__head">
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
      <MxPagination v-model:page="page" v-model:page-size="pageSize" :total="txs.length" />
    </template>

    <div v-else class="tx-table__empty">
      <MxEmpty :icon="RiHistoryLine" :text="filtered ? '没有匹配的交易记录' : '还没有交易记录，转账或一键清空后会出现在这里'" />
    </div>
  </section>
</template>

<style scoped>
.tx-table {
  --tx-columns: 76px 150px 48px minmax(110px, 1fr) minmax(150px, 1.1fr) minmax(150px, 1.1fr) minmax(170px, 1.2fr) 90px 28px;

  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
}

.tx-table__head {
  display: grid;
  grid-template-columns: var(--tx-columns);
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-sm);
  padding: 0 var(--mx-space-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.tx-table__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
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
