<script setup>
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import { useSwapAssetPicker, CUSTOM_KEY } from '@/composables/swap/useSwapAssetPicker'

const props = defineProps({
  /** 选中的资产 key（native / 合约地址小写 / custom） */
  modelValue: { type: String, default: '' },
  label: { type: String, default: '资产' },
  /** 候选资产 [{ key, symbol, decimals, native?, address? }] */
  assets: { type: Array, default: () => [] },
  /** key → 余额文案，可选 */
  balances: { type: Object, default: () => ({}) },
  /** 允许手填 ERC20 合约地址 */
  allowCustom: { type: Boolean, default: false },
  network: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
  error: { type: String, default: '' },
})

const emit = defineEmits(['update:modelValue', 'update:asset'])

const { customAddress, customError, resolving, options, onSelect } = useSwapAssetPicker(props, emit)
</script>

<template>
  <div class="asset-picker">
    <MdSelect :model-value="modelValue" dense :label="label" :options="options" :disabled="disabled" :error="error" placeholder="选择资产" @update:model-value="onSelect">
      <template #option="{ option }">
        <span class="asset-picker__option">
          <span>{{ option.label }}</span>
          <MdSkeleton v-if="loading && option.value !== CUSTOM_KEY" width="60px" />
          <span v-else class="asset-picker__balance md-body-small">{{ option.balance }}</span>
        </span>
      </template>
    </MdSelect>
    <MdTextField v-if="modelValue === CUSTOM_KEY" v-model="customAddress" dense label="ERC20 合约地址" placeholder="0x..." :error="customError" :disabled="disabled" mono>
      <template v-if="resolving" #trailing><MdProgress :size="18" /></template>
    </MdTextField>
  </div>
</template>

<style scoped>
.asset-picker {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  min-width: 0;
}

.asset-picker__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-4);
  width: 100%;
}

.asset-picker__balance {
  color: var(--md-sys-color-on-surface-variant);
}
</style>
