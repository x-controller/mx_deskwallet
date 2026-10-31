import { computed, ref, watch } from 'vue'
import { fetchTokenMeta } from '@/utils/chain'
import { isEvmAddress } from '@/utils/validate'

/** 「自定义合约地址」选项的 key */
export const CUSTOM_KEY = 'custom'

/**
 * 资产选择器：候选资产 + 可选的手填 ERC20 合约地址（读取链上元数据）。
 * props 需要 modelValue、assets、balances、allowCustom、network
 */
export function useSwapAssetPicker(props, emit) {
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

  return { customAddress, customError, resolving, options, onSelect, CUSTOM_KEY }
}
