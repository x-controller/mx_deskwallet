<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import WalletProgressList from '@/themes/classic/components/wallet/WalletProgressList.vue'
import { formatAmount } from '@/utils/format'
import { useBatchTransfer } from '@/composables/wallet/useBatchTransfer'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 可作为转出方的钱包（持有私钥） */
  wallets: { type: Array, default: () => [] },
  /** 打开时预选的转出钱包 */
  defaultWallet: { type: Object, default: null },
  /** 「填入列表钱包」用的钱包（选中或当前列表） */
  recipients: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const {
  fromId, assetKey, text, defaultAmount, errors, running, finished, locked,
  asset, walletOptions, assetOptions, balanceLoading, assetBalance,
  items, lineErrorText, totalText, estimate, feeTotalText, progress, progressRows, canStart, fillable, fillRecipients, start,
} = useBatchTransfer(props, emit)
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`批量转账 · ${network?.name ?? ''}`"
    width="680px"
    :closable="!running"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="network" class="batch">
      <div class="batch__row">
        <span class="batch__label">转出</span>
        <div class="batch__field">
          <MxSelect v-model="fromId" size="sm" :options="walletOptions" :disabled="locked" placeholder="选择转出钱包" />
          <p v-if="errors.from" class="batch__error">{{ errors.from }}</p>
        </div>
      </div>

      <div class="batch__row">
        <span class="batch__label">资产</span>
        <div class="batch__field">
          <MxSelect v-model="assetKey" size="sm" :options="assetOptions" :disabled="locked">
            <template #option="{ option }">
              <span class="batch__option">
                <span>{{ option.label }}</span>
                <MxSkeleton v-if="balanceLoading" width="60px" />
                <span v-else class="batch__option-balance">{{ option.balance }}</span>
              </span>
            </template>
          </MxSelect>
          <p class="batch__hint">
            <span>可用</span>
            <MxSkeleton v-if="balanceLoading" width="72px" />
            <span v-else>{{ assetBalance === null ? '—' : formatAmount(assetBalance, asset.decimals, 6) }} {{ asset?.symbol }}</span>
          </p>
        </div>
      </div>

      <div class="batch__row">
        <span class="batch__label">收款</span>
        <div class="batch__field">
          <MxInput v-model="text" :rows="7" :placeholder="`每行一个：地址 金额，用空格或逗号分隔\n0x1234…abcd 10.5\n没写金额的行使用下方统一金额`" :error="errors.text || lineErrorText" :disabled="locked" autofocus />
          <div class="batch__tools">
            <MxInput v-model="defaultAmount" size="sm" placeholder="统一金额（可选）" :error="errors.defaultAmount" :disabled="locked" class="batch__default">
              <template #suffix><span class="batch__symbol">{{ asset?.symbol }}</span></template>
            </MxInput>
            <MxButton size="sm" :disabled="locked || !fillable.length" @click="fillRecipients">填入列表钱包（{{ fillable.length }}）</MxButton>
          </div>
        </div>
      </div>

      <div class="batch__row">
        <span class="batch__label">合计</span>
        <div class="batch__field">
          <p class="batch__hint batch__summary">
            <template v-if="!items.length"><span>粘贴收款列表后自动汇总</span></template>
            <template v-else>
              <span>{{ items.length }} 笔，共 {{ totalText }} {{ asset?.symbol }}</span>
              <span class="batch__dot">·</span>
              <span>手续费</span>
              <MxSkeleton v-if="estimate.loading" width="90px" />
              <span v-else-if="estimate.error" class="is-error">估算失败</span>
              <span v-else-if="feeTotalText">约 {{ feeTotalText }} {{ network.symbol }}</span>
              <span v-else>—</span>
            </template>
          </p>
          <p v-if="estimate.error" class="batch__error">{{ estimate.error }}</p>
        </div>
      </div>

      <section v-if="running || finished" class="batch__section">
        <h3 class="batch__heading">各笔状态</h3>
        <WalletProgressList :wallets="progressRows" :progress="progress" />
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MxButton>
      <MxButton v-if="!finished" size="sm" type="primary" :disabled="!canStart" :loading="running" @click="start">
        开始转账{{ items.length ? ` ${items.length} 笔` : '' }}
      </MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.batch {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.batch__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.batch__label {
  width: 40px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.batch__field {
  flex: 1;
  min-width: 0;
}

.batch__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-space-md);
  width: 100%;
}

.batch__option-balance,
.batch__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.batch__tools {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  margin-top: var(--mx-space-xs);
}

.batch__default {
  flex: 1;
  max-width: 240px;
}

.batch__hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mx-space-xs);
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.batch__summary {
  margin-top: 0;
  line-height: var(--mx-size-sm);
}

.batch__dot {
  color: var(--mx-color-text-disabled);
}

.batch__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
  word-break: break-all;
}

.batch__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.batch__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
