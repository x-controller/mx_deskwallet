<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxCheckbox from '@/themes/classic/components/MxCheckbox.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import WalletProgressList from '@/themes/classic/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/classic/components/wallet/WalletLogPanel.vue'
import SwapAssetPicker from './SwapAssetPicker.vue'
import SwapQuotePanel from './SwapQuotePanel.vue'
import { formatAmount } from '@/utils/format'
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
  fromBalance, symbols, quoteIdleText, canStart, start,
} = useSwapForm(props, emit)
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`兑换 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`"
    width="680px"
    :closable="!running"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="network" class="swap">
      <div class="swap__row">
        <span class="swap__label">交易所</span>
        <div class="swap__field">
          <MxSelect v-model="dexId" size="sm" :options="dexOptions" :disabled="locked" placeholder="选择交易所" />
          <p v-if="errors.dex" class="swap__error">{{ errors.dex }}</p>
        </div>
      </div>

      <div class="swap__row swap__row--pair">
        <div class="swap__row swap__half">
          <span class="swap__label">卖出</span>
          <div class="swap__field">
            <SwapAssetPicker v-model="fromKey" :assets="assets" :balances="balances" :loading="balanceLoading" :disabled="locked" @update:asset="fromAsset = $event" />
            <p v-if="errors.from" class="swap__error">{{ errors.from }}</p>
          </div>
        </div>
        <div class="swap__row swap__half">
          <span class="swap__label">买入</span>
          <div class="swap__field">
            <SwapAssetPicker v-model="toKey" :assets="assets" :balances="balances" :loading="balanceLoading" :network="network" allow-custom :disabled="locked" @update:asset="toAsset = $event" />
            <p v-if="errors.to" class="swap__error">{{ errors.to }}</p>
          </div>
        </div>
      </div>

      <div class="swap__row">
        <span class="swap__label">数量</span>
        <div class="swap__field">
          <div class="swap__amount">
            <MxInput v-model="amount" size="sm" :placeholder="allMode ? '全部余额' : '0.0'" :error="errors.amount" :disabled="locked || allMode" class="swap__amount-input">
              <template #suffix><span class="swap__symbol">{{ fromAsset?.symbol ?? '' }}</span></template>
            </MxInput>
            <MxCheckbox v-model="allMode" :disabled="locked">全部余额</MxCheckbox>
          </div>
          <p v-if="single" class="swap__hint">
            <span>可用</span>
            <MxSkeleton v-if="balanceLoading" width="72px" />
            <span v-else>{{ fromBalance === null ? '—' : formatAmount(fromBalance, fromAsset?.decimals ?? 18, 6) }} {{ fromAsset?.symbol ?? '' }}</span>
          </p>
          <p v-else class="swap__hint">每个钱包各自卖出该数量{{ allMode ? '' : '，余额不足的钱包会失败' }}</p>
        </div>
      </div>

      <div class="swap__row swap__row--pair">
        <div class="swap__row swap__half">
          <span class="swap__label">滑点</span>
          <div class="swap__field">
            <MxInput v-model="slippage" size="sm" :error="errors.slippage" :disabled="locked" class="swap__slippage">
              <template #suffix><span class="swap__symbol">%</span></template>
            </MxInput>
          </div>
        </div>
        <div class="swap__row swap__half swap__row--check">
          <MxCheckbox v-model="approveUnlimited" :disabled="locked || fromAsset?.native">无限授权（省下次 approve 的 gas）</MxCheckbox>
        </div>
      </div>

      <SwapQuotePanel :quote="quote" :from-asset="fromAsset" :to-asset="toAsset" :symbols="symbols" :idle-text="quoteIdleText" />

      <section v-if="running || finished" class="swap__section">
        <h3 class="swap__heading">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" />
      </section>

      <section v-if="logs.length" class="swap__section">
        <h3 class="swap__heading">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MxButton>
      <MxButton v-if="!finished" size="sm" type="primary" :disabled="!canStart" :loading="running" @click="start">开始兑换</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.swap {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.swap__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.swap__row--pair {
  gap: var(--mx-space-md);
}

.swap__half {
  flex: 1;
  min-width: 0;
}

.swap__row--check {
  align-items: center;
}

.swap__label {
  width: 48px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__half + .swap__half .swap__label {
  width: auto;
}

.swap__field {
  flex: 1;
  min-width: 0;
}

.swap__amount {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
}

.swap__amount-input {
  flex: 1;
}

.swap__amount :deep(.mx-checkbox) {
  height: var(--mx-size-sm);
}

.swap__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__slippage {
  max-width: 120px;
}

.swap__hint {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
}

.swap__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.swap__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}
</style>
