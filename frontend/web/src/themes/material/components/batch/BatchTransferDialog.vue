<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
import WalletProgressList from '@/themes/material/components/wallet/WalletProgressList.vue'
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
  items, lineErrorText, totalText, estimate, feeTotalText, progress, progressRows, canStart, fillable, fillRecipients, start, toPlaceholder,
} = useBatchTransfer(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" :title="`批量转账 · ${network?.name ?? ''}`" icon="call_split" width="720px" :closable="!running" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="network" class="batch">
      <div class="batch__pair">
        <MdSelect v-model="fromId" dense label="转出钱包" :options="walletOptions" :disabled="locked" :error="errors.from" placeholder="选择转出钱包" />
        <MdSelect v-model="assetKey" dense label="资产" :options="assetOptions" :disabled="locked">
          <template #option="{ option }">
            <span class="batch__option">
              <span>{{ option.label }}</span>
              <MdSkeleton v-if="balanceLoading" width="60px" />
              <span v-else class="batch__option-balance md-body-small">{{ option.balance }}</span>
            </span>
          </template>
        </MdSelect>
      </div>

      <MdTextField
        v-model="text"
        :rows="7"
        label="收款列表"
        :placeholder="`每行一个：地址 金额，用空格或逗号分隔\n${toPlaceholder.replace('...', '1234…abcd')} 10.5\n没写金额的行使用统一金额`"
        :supporting-text="items.length ? `识别到 ${items.length} 笔` : '粘贴后自动识别'"
        :error="errors.text || lineErrorText"
        :disabled="locked"
        autofocus
        mono
      />

      <div class="batch__tools">
        <MdTextField v-model="defaultAmount" dense label="统一金额（可选）" placeholder="0.0" :error="errors.defaultAmount" :disabled="locked" class="batch__default">
          <template #trailing><span class="md-body-small md-on-surface-variant">{{ asset?.symbol }}</span></template>
        </MdTextField>
        <MdButton variant="tonal" dense :disabled="locked || !fillable.length" @click="fillRecipients">填入列表钱包（{{ fillable.length }}）</MdButton>
      </div>

      <div class="summary">
        <MdKeyValue label="可用">
          <MdSkeleton v-if="balanceLoading" width="72px" />
          <span v-else>{{ assetBalance === null ? '—' : formatAmount(assetBalance, asset.decimals, 6) }} {{ asset?.symbol }}</span>
        </MdKeyValue>
        <MdKeyValue label="合计">
          <span v-if="!items.length" class="md-on-surface-variant">粘贴收款列表后自动汇总</span>
          <span v-else>{{ items.length }} 笔，共 {{ totalText }} {{ asset?.symbol }}</span>
        </MdKeyValue>
        <MdKeyValue label="手续费">
          <MdSkeleton v-if="estimate.loading" width="90px" />
          <span v-else-if="estimate.error" class="md-error-text">估算失败：{{ estimate.error }}</span>
          <span v-else-if="feeTotalText">约 {{ feeTotalText }} {{ network.symbol }}</span>
          <span v-else class="md-on-surface-variant">填写收款列表后估算</span>
        </MdKeyValue>
      </div>

      <section v-if="running || finished" class="batch__section">
        <h3 class="batch__heading md-title-small">各笔状态</h3>
        <WalletProgressList :wallets="progressRows" :progress="progress" />
      </section>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MdButton>
      <MdButton v-if="!finished" :disabled="!canStart" :loading="running" @click="start">开始转账{{ items.length ? ` ${items.length} 笔` : '' }}</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.batch {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  padding-top: var(--md-space-1);
}

.batch__pair {
  display: grid;
  grid-template-columns: 1fr 1fr;
  align-items: flex-start;
  gap: var(--md-space-4);
}

.batch__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-4);
  width: 100%;
}

.batch__option-balance {
  color: var(--md-sys-color-on-surface-variant);
}

.batch__tools {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-4);
}

.batch__default {
  flex: 1;
  max-width: 260px;
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.batch__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.batch__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}
</style>
