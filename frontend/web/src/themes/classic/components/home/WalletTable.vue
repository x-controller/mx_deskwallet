<script setup>
import { RiArrowLeftRightLine, RiDeleteBinLine, RiEraserLine, RiPencilLine, RiSendPlaneLine, RiWallet3Line } from '@remixicon/vue'
import MxCheckbox from '@/themes/classic/components/MxCheckbox.vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import MxEmpty from '@/themes/classic/components/MxEmpty.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import WalletTokenCell from './WalletTokenCell.vue'
import { isWatchWallet } from '@/stores/wallet'
import { formatAmount } from '@/utils/format'
import { useWalletTable, WATCH_HINT } from '@/composables/home/useWalletTable'

const props = defineProps({
  /** 当前可见（已按分组 / 关键字过滤）的钱包 */
  wallets: { type: Array, default: () => [] },
  /** 是否因为筛选导致为空（用于区分“没有钱包”和“没有匹配”） */
  filtered: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'drain', 'transfer', 'swap', 'import', 'create', 'watch'])

const { walletStore, networkStore, groupName, symbol, allChecked, indeterminate, toggleAll, balanceOf, remove } = useWalletTable(props)
</script>

<template>
  <section class="wallet-table">
    <div class="wallet-table__head">
      <MxCheckbox :model-value="allChecked" :indeterminate="indeterminate" :disabled="!wallets.length" @change="toggleAll" />
      <span>名称</span>
      <span>地址</span>
      <span class="is-right">余额</span>
      <span>Token</span>
      <span>分组</span>
      <span class="is-right">操作</span>
    </div>

    <div v-if="wallets.length" class="wallet-table__body">
      <div v-for="w in wallets" :key="w.id" class="wallet-row" :class="{ 'is-selected': walletStore.selectedIds.has(w.id) }">
        <MxCheckbox :model-value="walletStore.selectedIds.has(w.id)" @change="walletStore.toggleSelect(w.id, $event)" />
        <span class="wallet-row__name" :title="w.name">
          <MxTag v-if="isWatchWallet(w)" type="info">观察</MxTag>
          <span class="wallet-row__name-text">{{ w.name }}</span>
        </span>
        <MxAddress :address="w.address" :head="8" :tail="6" />
        <span class="wallet-row__balance is-right">
          <MxSkeleton v-if="balanceOf(w)?.loading" width="72px" />
          <MxTooltip v-else-if="balanceOf(w)?.error" :content="balanceOf(w).error">
            <span class="is-error">查询失败</span>
          </MxTooltip>
          <template v-else-if="balanceOf(w)?.raw !== null && balanceOf(w)?.raw !== undefined">
            {{ formatAmount(balanceOf(w).raw, 18, 6) }} <span class="wallet-row__symbol">{{ symbol }}</span>
          </template>
          <span v-else class="wallet-row__symbol">—</span>
        </span>
        <WalletTokenCell :balance="balanceOf(w)" :tokens="networkStore.activeNetwork?.tokens ?? []" />
        <span><MxTag>{{ groupName[w.groupId] || '默认' }}</MxTag></span>
        <span class="wallet-row__actions">
          <MxTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}转账` : '转账'">
            <MxButton icon size="xs" type="surface" aria-label="转账" :disabled="isWatchWallet(w)" @click="emit('transfer', w)"><RiSendPlaneLine size="14" /></MxButton>
          </MxTooltip>
          <MxTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}兑换` : '兑换'">
            <MxButton icon size="xs" type="surface" aria-label="兑换" :disabled="isWatchWallet(w)" @click="emit('swap', w)"><RiArrowLeftRightLine size="14" /></MxButton>
          </MxTooltip>
          <MxTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}清空` : '清空此钱包'">
            <MxButton icon size="xs" type="surface" aria-label="清空此钱包" :disabled="isWatchWallet(w)" @click="emit('drain', w)"><RiEraserLine size="14" /></MxButton>
          </MxTooltip>
          <MxTooltip content="编辑">
            <MxButton icon size="xs" type="surface" aria-label="编辑" @click="emit('edit', w)"><RiPencilLine size="14" /></MxButton>
          </MxTooltip>
          <MxTooltip content="删除">
            <MxButton icon size="xs" type="surface" aria-label="删除" @click="remove(w)"><RiDeleteBinLine size="14" /></MxButton>
          </MxTooltip>
        </span>
      </div>
    </div>

    <div v-else class="wallet-table__empty">
      <MxEmpty :icon="RiWallet3Line" :text="filtered ? '没有匹配的钱包' : '还没有钱包，先导入私钥、创建一个，或添加只看余额的观察钱包'">
        <template v-if="!filtered">
          <MxButton size="sm" @click="emit('watch')">添加观察钱包</MxButton>
          <MxButton size="sm" @click="emit('import')">导入私钥</MxButton>
          <MxButton size="sm" type="primary" @click="emit('create')">创建钱包</MxButton>
        </template>
      </MxEmpty>
    </div>
  </section>
</template>

<style scoped>
.wallet-table {
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
}

.wallet-table__head,
.wallet-row {
  display: grid;
  grid-template-columns: 28px minmax(80px, 0.9fr) minmax(190px, 1.4fr) minmax(100px, 0.9fr) minmax(150px, 1.3fr) 76px 144px;
  align-items: center;
  gap: var(--mx-space-sm);
  padding: 0 var(--mx-space-sm);
}

.wallet-table__head {
  height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.wallet-table__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.wallet-row {
  height: var(--mx-size-md);
  margin-bottom: var(--mx-space-xxs);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  transition: background var(--mx-transition);
}

.wallet-row:hover {
  background: var(--mx-color-bg-hover);
}

.wallet-row.is-selected {
  background: var(--mx-color-bg-active);
}

.wallet-row__name {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
  min-width: 0;
}

.wallet-row__name-text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.is-right {
  text-align: right;
  justify-self: end;
}

.wallet-row__balance {
  white-space: nowrap;
}

.wallet-row__symbol {
  font-size: var(--mx-font-xs);
  color: var(--mx-color-text-secondary);
}

.is-error {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
}

.wallet-row__actions {
  display: inline-flex;
  justify-content: flex-end;
  gap: var(--mx-space-xxs);
}

.wallet-table__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
