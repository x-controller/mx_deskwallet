<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import { formatAmount } from '@/utils/format'
import { useTransferForm } from '@/composables/wallet/useTransferForm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 转出钱包 */
  wallet: { type: Object, default: null },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { assetKey, to, amount, errors, sending, estimate, asset, balance, assetBalance, assetOptions, fillMax, submit } = useTransferForm(props, emit)
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`转账 · ${wallet?.name ?? ''} · ${network?.name ?? ''}`"
    width="520px"
    :closable="!sending"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="wallet && network" class="transfer">
      <div class="transfer__row">
        <span class="transfer__label">转出</span>
        <MxAddress :address="wallet.address" full button-type="default" class="transfer__field" />
      </div>

      <div class="transfer__row">
        <span class="transfer__label">资产</span>
        <MxSelect v-model="assetKey" size="sm" :options="assetOptions" :disabled="sending" class="transfer__field">
          <template #option="{ option }">
            <span class="transfer__option">
              <span>{{ option.label }}</span>
              <MxSkeleton v-if="balance?.loading" width="60px" />
              <span v-else class="transfer__option-balance">{{ option.balance }}</span>
            </span>
          </template>
        </MxSelect>
      </div>

      <div class="transfer__row">
        <span class="transfer__label">接收</span>
        <MxInput v-model="to" size="sm" placeholder="接收地址 0x..." :error="errors.to" :disabled="sending" autofocus class="transfer__field" />
      </div>

      <div class="transfer__row">
        <span class="transfer__label">金额</span>
        <div class="transfer__field">
          <MxInput v-model="amount" size="sm" placeholder="0.0" :error="errors.amount" :disabled="sending" @enter="submit">
            <template #suffix>
              <span class="transfer__symbol">{{ asset?.symbol }}</span>
              <MxButton size="xs" :disabled="sending || assetBalance === null" @click="fillMax">全部</MxButton>
            </template>
          </MxInput>
          <p class="transfer__hint">
            <span>可用</span>
            <MxSkeleton v-if="balance?.loading" width="72px" />
            <span v-else>{{ assetBalance === null ? '—' : formatAmount(assetBalance, asset.decimals, 6) }} {{ asset?.symbol }}</span>
            <span class="transfer__dot">·</span>
            <span>手续费</span>
            <MxSkeleton v-if="estimate.loading" width="90px" />
            <span v-else-if="estimate.error" class="is-error">估算失败</span>
            <span v-else-if="estimate.fee !== null">≤ {{ formatAmount(estimate.fee, 18, 8) }} {{ network.symbol }}</span>
            <span v-else>—</span>
          </p>
          <p v-if="estimate.error" class="transfer__error">{{ estimate.error }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="sending" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :loading="sending" :disabled="balance?.loading" @click="submit">转账</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.transfer {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.transfer__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.transfer__label {
  width: 40px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__field {
  flex: 1;
  min-width: 0;
  line-height: var(--mx-size-sm);
  word-break: break-all;
}

.transfer__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-space-md);
  width: 100%;
}

.transfer__option-balance {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mx-space-xs);
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__dot {
  color: var(--mx-color-text-disabled);
}

.transfer__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
  word-break: break-all;
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
