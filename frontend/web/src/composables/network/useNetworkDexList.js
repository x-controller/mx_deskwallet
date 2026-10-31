import { computed, ref } from 'vue'
import { DEX_VERSIONS, FEE_TIERS_UNISWAP, feeTierLabel, fetchDexWrapped } from '@/utils/dex'
import { isEvmAddress, isHttpUrl } from '@/utils/validate'
import { message } from '@/utils/message'

/** 网络表单里的交易所列表：V2 / V3 Router 校验、读取包装币后加入，可移除。props 需要 modelValue、network */
export function useNetworkDexList(props, emit) {
  const name = ref('')
  const version = ref('v2')
  const router = ref('')
  const quoter = ref('')
  const feeTiers = ref(FEE_TIERS_UNISWAP.join(','))
  const errors = ref({})
  const loading = ref(false)

  const isV3 = computed(() => version.value === 'v3')

  /** 回车只添加交易所，不触发外层网络表单的提交 */
  function onEnter(e) {
    e.preventDefault()
    add()
  }

  function parseFeeTiers() {
    const list = feeTiers.value
      .split(/[,，\s]+/)
      .filter(Boolean)
      .map(Number)
    if (!list.length || list.some((n) => !Number.isInteger(n) || n <= 0 || n >= 1000000)) return null
    return [...new Set(list)].sort((a, b) => a - b)
  }

  async function add() {
    const n = name.value.trim()
    const r = router.value.trim()
    const q = quoter.value.trim()
    const tiers = isV3.value ? parseFeeTiers() : []
    errors.value = {}
    if (!n) errors.value.name = '请输入交易所名称'
    if (!isEvmAddress(r)) errors.value.router = 'Router 合约地址格式不正确'
    else if (props.modelValue.some((d) => d.router.toLowerCase() === r.toLowerCase())) errors.value.router = '该 Router 已存在'
    if (isV3.value && !isEvmAddress(q)) errors.value.quoter = 'Quoter 合约地址格式不正确'
    if (isV3.value && !tiers) errors.value.feeTiers = '手续费档位须为正整数（万分比），逗号分隔'
    if (Object.keys(errors.value).length) return
    if (!isHttpUrl(props.network.rpcUrl) || !props.network.chainId) {
      errors.value = { router: '请先填写 RPC 地址与 Chain ID' }
      return
    }
    const dex = isV3.value
      ? { id: crypto.randomUUID(), name: n, version: 'v3', router: r, quoter: q, feeTiers: tiers }
      : { id: crypto.randomUUID(), name: n, version: 'v2', router: r }
    loading.value = true
    try {
      dex.wrappedNative = await fetchDexWrapped(props.network, dex)
      emit('update:modelValue', [...props.modelValue, dex])
      name.value = ''
      router.value = ''
      quoter.value = ''
      message.success(`已添加 ${n}`)
    } catch (e) {
      errors.value = { router: isV3.value ? `读取路由信息失败：${e?.shortMessage || e?.message || '请确认 Router / Quoter 地址'}` : '读取路由信息失败，请确认是 Uniswap V2 兼容的 Router 合约' }
    } finally {
      loading.value = false
    }
  }

  function remove(i) {
    emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
  }

  /** 列表里 V3 交易所的悬停说明 */
  const v3Detail = (d) => `Quoter ${d.quoter}\n档位 ${(d.feeTiers ?? []).map(feeTierLabel).join(' / ')}`

  return { name, version, router, quoter, feeTiers, errors, loading, isV3, onEnter, add, remove, v3Detail, DEX_VERSIONS }
}
