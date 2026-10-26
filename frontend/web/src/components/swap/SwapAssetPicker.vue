<script>
/** 「自定义合约地址」选项的 key */
export const CUSTOM_KEY = 'custom'
</script>

<script setup>
import { computed, ref, watch } from 'vue'
import MxSelect from '@/components/MxSelect.vue'
import MxInput from '@/components/MxInput.vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import { fetchTokenMeta } from '@/utils/chain'
import { isEvmAddress } from '@/utils/validate'

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

const customAddress = ref('')
const customError = ref('')
const resolving = ref(false)
let seq = 0

const options = computed(() => {
  const list = props.assets.map((a) => ({ label: a.symbol, value: a.key, balance: props.balances[a.key] ?? '' }))
  if (props.allowCustom) list.push({ label: '自定义合约地址…', value: CUSTOM_KEY, balance: '' })
  return list
})

async function resolveCustom() {
  const addr = customAddress.value.trim()
  customError.value = ''
  emit('update:asset', null)
  if (!addr) return
  if (!isEvmAddress(addr)) {
    customError.value = '合约地址格式不正确'
    return
  }
  const listed = props.assets.find((a) => a.address && a.address.toLowerCase() === addr.toLowerCase())
  if (listed) {
    emit('update:asset', listed)
    return
  }
  const my = ++seq
  resolving.value = true
  try {
    const meta = await fetchTokenMeta(props.network, addr)
    if (my !== seq) return
    emit('update:asset', { key: CUSTOM_KEY, address: addr, ...meta })
  } catch {
    if (my !== seq) return
    customError.value = '读取 Token 信息失败，请检查合约地址'
  } finally {
    if (my === seq) resolving.value = false
  }
}

/** key 或候选列表变化都重新解析出资产对象，外部 reset 也能同步 */
function resolve() {
  if (props.modelValue === CUSTOM_KEY) {
    resolveCustom()
    return
  }
  emit('update:asset', props.assets.find((a) => a.key === props.modelValue) ?? null)
}

function onSelect(key) {
  if (key === CUSTOM_KEY) {
    customAddress.value = ''
    customError.value = ''
  }
  emit('update:modelValue', key)
}

watch(customAddress, resolveCustom)
watch([() => props.modelValue, () => props.assets], resolve, { immediate: true })
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
