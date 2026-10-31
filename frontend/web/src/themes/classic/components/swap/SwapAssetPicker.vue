<script setup>
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import { useSwapAssetPicker, CUSTOM_KEY } from '@/composables/swap/useSwapAssetPicker'

const props = defineProps({
  /** 选中的资产 key（native / 合约地址小写 / custom） */
  modelValue: { type: String, default: '' },
  /** 候选资产 [{ key, symbol, decimals, native?, address? }] */
  assets: { type: Array, default: () => [] },
  /** key → 余额文案，可选 */
  balances: { type: Object, default: () => ({}) },
  /** 允许手填 ERC20 合约地址 */
  allowCustom: { type: Boolean, default: false },
  network: { type: Object, default: null },
  disabled: { type: Boolean, default: false },
  loading: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue', 'update:asset'])

const { customAddress, customError, resolving, options, onSelect } = useSwapAssetPicker(props, emit)
</script>

<template>
  <div class="asset-picker">
    <MxSelect :model-value="modelValue" size="sm" :options="options" :disabled="disabled" placeholder="选择资产" @update:model-value="onSelect">
      <template #option="{ option }">
        <span class="asset-picker__option">
          <span>{{ option.label }}</span>
          <MxSkeleton v-if="loading && option.value !== CUSTOM_KEY" width="60px" />
          <span v-else class="asset-picker__balance">{{ option.balance }}</span>
        </span>
      </template>
    </MxSelect>
    <MxInput
      v-if="modelValue === CUSTOM_KEY"
      v-model="customAddress"
      size="sm"
      placeholder="ERC20 合约地址 0x..."
      :error="customError"
      :disabled="disabled"
      class="asset-picker__custom"
    >
      <template v-if="resolving" #suffix><MxSkeleton width="40px" /></template>
    </MxInput>
  </div>
</template>

<style scoped>
.asset-picker {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
  min-width: 0;
}

.asset-picker__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-space-md);
  width: 100%;
}

.asset-picker__balance {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
