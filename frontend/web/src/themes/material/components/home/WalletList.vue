<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdCheckbox from '@/themes/material/components/MdCheckbox.vue'
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdEmpty from '@/themes/material/components/MdEmpty.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import WalletTokenCell from './WalletTokenCell.vue'
import { isWatchWallet } from '@/stores/wallet'
import { formatAmount } from '@/utils/format'
import { useWalletTable, WATCH_HINT } from '@/composables/home/useWalletTable'

const props = defineProps({
  /** 当前可见（已按分组 / 关键字过滤）的钱包 */
  wallets: { type: Array, default: () => [] },
  /** 是否因为筛选导致为空（用于区分“没有钱包”和“没有匹配”） */
  filtered: { type: Boolean, default: false },
  /** 余额刷新中：顶部显示线性进度 */
  refreshing: { type: Boolean, default: false },
})

const emit = defineEmits(['edit', 'drain', 'transfer', 'swap', 'import', 'create', 'watch'])

const { walletStore, networkStore, groupName, symbol, decimals, displayAddress, allChecked, indeterminate, toggleAll, balanceOf, remove } = useWalletTable(props)
</script>

<template>
  <section class="wallet-list">
    <MdProgress v-if="refreshing" type="linear" class="wallet-list__progress" />
    <div class="wallet-list__head md-label-medium">
      <MdCheckbox :model-value="allChecked" :indeterminate="indeterminate" :disabled="!wallets.length" @change="toggleAll" />
      <span>名称</span>
      <span>地址</span>
      <span class="is-right">余额</span>
      <span>Token</span>
      <span>分组</span>
      <span class="is-right">操作</span>
    </div>

    <div v-if="wallets.length" class="wallet-list__body">
      <div v-for="w in wallets" :key="w.id" class="wallet-row" :class="{ 'is-selected': walletStore.selectedIds.has(w.id) }">
        <MdCheckbox :model-value="walletStore.selectedIds.has(w.id)" @change="walletStore.toggleSelect(w.id, $event)" />
        <span class="wallet-row__name" :title="w.name">
          <MdChip v-if="isWatchWallet(w)" tone="tertiary">观察</MdChip>
          <span class="wallet-row__name-text md-body-medium">{{ w.name }}</span>
        </span>
        <MdAddress :address="displayAddress(w)" :head="8" :tail="6" />
        <span class="wallet-row__balance is-right">
          <MdSkeleton v-if="balanceOf(w)?.loading" width="72px" />
          <MdTooltip v-else-if="balanceOf(w)?.error" :content="balanceOf(w).error">
            <span class="md-error-text md-body-small">查询失败</span>
          </MdTooltip>
          <template v-else-if="balanceOf(w)?.raw !== null && balanceOf(w)?.raw !== undefined">
            <span class="wallet-row__amount">{{ formatAmount(balanceOf(w).raw, decimals, 6) }}</span> <span class="wallet-row__symbol md-label-small">{{ symbol }}</span>
          </template>
          <span v-else class="wallet-row__symbol">—</span>
        </span>
        <WalletTokenCell :balance="balanceOf(w)" :tokens="networkStore.activeNetwork?.tokens ?? []" />
        <span><MdChip>{{ groupName[w.groupId] || '默认' }}</MdChip></span>
        <span class="wallet-row__actions">
          <MdTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}转账` : '转账'">
            <MdIconButton size="sm" aria-label="转账" :disabled="isWatchWallet(w)" @click="emit('transfer', w)"><MdIcon name="send" /></MdIconButton>
          </MdTooltip>
          <MdTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}兑换` : '兑换'">
            <MdIconButton size="sm" aria-label="兑换" :disabled="isWatchWallet(w)" @click="emit('swap', w)"><MdIcon name="swap_horiz" /></MdIconButton>
          </MdTooltip>
          <MdTooltip :content="isWatchWallet(w) ? `${WATCH_HINT}清空` : '清空此钱包'">
            <MdIconButton size="sm" aria-label="清空此钱包" :disabled="isWatchWallet(w)" @click="emit('drain', w)"><MdIcon name="cleaning_services" /></MdIconButton>
          </MdTooltip>
          <MdTooltip content="编辑">
            <MdIconButton size="sm" aria-label="编辑" @click="emit('edit', w)"><MdIcon name="edit" /></MdIconButton>
          </MdTooltip>
          <MdTooltip content="删除">
            <MdIconButton size="sm" aria-label="删除" @click="remove(w)"><MdIcon name="delete" /></MdIconButton>
          </MdTooltip>
        </span>
      </div>
    </div>

    <div v-else class="wallet-list__empty">
      <MdEmpty icon="wallet" :text="filtered ? '没有匹配的钱包' : '还没有钱包，先导入私钥、创建一个，或添加只看余额的观察钱包'">
        <template v-if="!filtered">
          <MdButton variant="text" @click="emit('watch')">添加观察钱包</MdButton>
          <MdButton variant="tonal" @click="emit('import')">导入私钥</MdButton>
          <MdButton @click="emit('create')">创建钱包</MdButton>
        </template>
      </MdEmpty>
    </div>
  </section>
</template>

<style scoped>
.wallet-list {
  position: relative;
  display: flex;
  flex-direction: column;
  flex: 1;
  min-width: 0;
  min-height: 0;
}

.wallet-list__progress {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  border-radius: 0;
}

.wallet-list__head,
.wallet-row {
  display: grid;
  grid-template-columns: 40px minmax(90px, 0.9fr) minmax(200px, 1.4fr) minmax(110px, 0.9fr) minmax(150px, 1.3fr) 84px 168px;
  align-items: center;
  gap: var(--md-space-2);
  padding: 0 var(--md-space-3) 0 var(--md-space-2);
}

.wallet-list__head {
  height: 44px;
  color: var(--md-sys-color-on-surface-variant);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
}

.wallet-list__body {
  flex: 1;
  min-height: 0;
  overflow-y: auto;
}

.wallet-row {
  height: 52px;
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
  transition: background var(--md-sys-motion-duration-short2) linear;
}

.wallet-row:hover {
  background: color-mix(in srgb, var(--md-sys-color-on-surface) 8%, transparent);
}

.wallet-row.is-selected {
  background: color-mix(in srgb, var(--md-sys-color-primary) 12%, transparent);
}

.wallet-row__name {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
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

.wallet-row__amount {
  font-family: var(--md-ref-typeface-mono);
}

.wallet-row__symbol {
  color: var(--md-sys-color-on-surface-variant);
}

.wallet-row__actions {
  display: inline-flex;
  justify-content: flex-end;
}

.wallet-list__empty {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>
