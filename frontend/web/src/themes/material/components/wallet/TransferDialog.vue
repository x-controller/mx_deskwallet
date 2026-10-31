<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
import { useTransferForm } from '@/composables/wallet/useTransferForm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 转出钱包 */
  wallet: { type: Object, default: null },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { assetKey, to, amount, errors, sending, estimate, asset, balance, assetBalance, assetBalanceText, feeText, toPlaceholder, fromAddress, assetOptions, fillMax, submit } = useTransferForm(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" :title="`转账 · ${wallet?.name ?? ''}`" icon="send" width="560px" :closable="!sending" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="wallet && network" class="form">
      <MdKeyValue label="转出">
        <MdAddress :address="fromAddress" full />
      </MdKeyValue>
      <MdKeyValue label="网络">{{ network.name }}</MdKeyValue>

      <MdSelect v-model="assetKey" dense label="资产" :options="assetOptions" :disabled="sending">
        <template #option="{ option }">
          <span class="option">
            <span>{{ option.label }}</span>
            <MdSkeleton v-if="balance?.loading" width="60px" />
            <span v-else class="option__balance md-body-small">{{ option.balance }}</span>
          </span>
        </template>
      </MdSelect>

      <MdTextField v-model="to" dense label="接收地址" :placeholder="toPlaceholder" :error="errors.to" :disabled="sending" autofocus mono />

      <MdTextField v-model="amount" dense label="金额" placeholder="0.0" :error="errors.amount" :disabled="sending" @enter="submit">
        <template #trailing>
          <span class="md-body-small md-on-surface-variant">{{ asset?.symbol }}</span>
          <MdButton variant="text" dense :disabled="sending || assetBalance === null" @click="fillMax">全部</MdButton>
        </template>
      </MdTextField>

      <div class="summary">
        <MdKeyValue label="可用">
          <MdSkeleton v-if="balance?.loading" width="72px" />
          <span v-else>{{ assetBalanceText }} {{ asset?.symbol }}</span>
        </MdKeyValue>
        <MdKeyValue label="手续费">
          <MdSkeleton v-if="estimate.loading" width="90px" />
          <span v-else-if="estimate.error" class="md-error-text">估算失败：{{ estimate.error }}</span>
          <span v-else-if="estimate.fee !== null">≤ {{ feeText }} {{ network.symbol }}</span>
          <span v-else class="md-on-surface-variant">填写地址与金额后估算</span>
        </MdKeyValue>
      </div>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="sending" @click="emit('update:modelValue', false)">取消</MdButton>
      <MdButton :loading="sending" :disabled="balance?.loading" @click="submit">转账</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.form {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  padding-top: var(--md-space-1);
}

.option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-4);
  width: 100%;
}

.option__balance {
  color: var(--md-sys-color-on-surface-variant);
}

.summary {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}
</style>
