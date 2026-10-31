<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdSwitch from '@/themes/material/components/MdSwitch.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import WalletProgressList from '@/themes/material/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/material/components/wallet/WalletLogPanel.vue'
import SwapAssetPicker from './SwapAssetPicker.vue'
import SwapQuotePanel from './SwapQuotePanel.vue'
import { useSwapForm } from '@/composables/swap/useSwapForm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 要兑换的钱包列表 */
  wallets: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const {
  dexId, fromKey, toKey, fromAsset, toAsset, amount, allMode, slippage, approveUnlimited, errors, quote,
  progress, logs, running, finished, locked, single, dexOptions, assets, balances, balanceLoading,
  fromBalanceText, symbols, quoteIdleText, canStart, start,
} = useSwapForm(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" :title="`兑换 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`" width="720px" :closable="!running" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="network" class="swap">
      <MdSelect v-model="dexId" dense label="交易所" :options="dexOptions" :disabled="locked" placeholder="选择交易所" :error="errors.dex" />

      <div class="swap__pair">
        <SwapAssetPicker v-model="fromKey" label="卖出" :assets="assets" :balances="balances" :loading="balanceLoading" :disabled="locked" :error="errors.from" @update:asset="fromAsset = $event" />
        <SwapAssetPicker v-model="toKey" label="买入" :assets="assets" :balances="balances" :loading="balanceLoading" :network="network" allow-custom :disabled="locked" :error="errors.to" @update:asset="toAsset = $event" />
      </div>

      <div class="swap__amount">
        <MdTextField
          v-model="amount"
          dense
          label="数量"
          :placeholder="allMode ? '全部余额' : '0.0'"
          :error="errors.amount"
          :disabled="locked || allMode"
          :supporting-text="single ? '' : `每个钱包各自卖出该数量${allMode ? '' : '，余额不足的钱包会失败'}`"
          class="swap__amount-input"
        >
          <template #trailing><span class="md-body-small md-on-surface-variant">{{ fromAsset?.symbol ?? '' }}</span></template>
        </MdTextField>
        <MdSwitch v-model="allMode" :disabled="locked" class="swap__switch">全部余额</MdSwitch>
      </div>
      <p v-if="single" class="swap__hint md-body-small">
        <span>可用</span>
        <MdSkeleton v-if="balanceLoading" width="72px" />
        <span v-else>{{ fromBalanceText }} {{ fromAsset?.symbol ?? '' }}</span>
      </p>

      <div class="swap__pair">
        <MdTextField v-model="slippage" dense label="滑点" :error="errors.slippage" :disabled="locked" class="swap__slippage">
          <template #trailing><span class="md-body-small md-on-surface-variant">%</span></template>
        </MdTextField>
        <MdSwitch v-model="approveUnlimited" :disabled="locked || fromAsset?.native" class="swap__switch">无限授权（省下次 approve 的 gas）</MdSwitch>
      </div>

      <SwapQuotePanel :quote="quote" :from-asset="fromAsset" :to-asset="toAsset" :symbols="symbols" :idle-text="quoteIdleText" />

      <section v-if="running || finished" class="swap__section">
        <h3 class="swap__heading md-title-small">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" :network="network" />
      </section>

      <section v-if="logs.length" class="swap__section">
        <h3 class="swap__heading md-title-small">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MdButton>
      <MdButton v-if="!finished" :disabled="!canStart" :loading="running" @click="start">开始兑换</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.swap {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  padding-top: var(--md-space-1);
}

.swap__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: flex-start;
  gap: var(--md-space-4);
}

.swap__amount {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-4);
}

.swap__amount-input {
  flex: 1;
}

.swap__switch {
  height: var(--md-comp-text-field-height-dense);
  flex-shrink: 0;
}

.swap__slippage {
  max-width: 160px;
}

.swap__hint {
  display: flex;
  align-items: center;
  gap: var(--md-space-1);
  margin: calc(var(--md-space-2) * -1) 0 0 var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
}

.swap__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.swap__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}
</style>
