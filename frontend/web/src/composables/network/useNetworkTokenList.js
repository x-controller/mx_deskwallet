import { ref } from 'vue'
import { fetchTokenMeta, isTron } from '@/utils/chain'
import { isChainAddress, isHttpUrl } from '@/utils/validate'
import { message } from '@/utils/message'

/** 网络表单里的 Token 列表：按合约地址读取元数据后加入，可移除。props 需要 modelValue、network */
export function useNetworkTokenList(props, emit) {
  const address = ref('')
  const error = ref('')
  const loading = ref(false)

  /** 回车只添加 Token，不触发外层网络表单的提交 */
  function onEnter(e) {
    e.preventDefault()
    add()
  }

  async function add() {
    const addr = address.value.trim()
    error.value = ''
    if (!isChainAddress(props.network, addr)) {
      error.value = '合约地址格式不正确'
      return
    }
    if (props.modelValue.some((t) => t.address.toLowerCase() === addr.toLowerCase())) {
      error.value = '该 Token 已存在'
      return
    }
    if (!isHttpUrl(props.network.rpcUrl) || (!isTron(props.network) && !props.network.chainId)) {
      error.value = isTron(props.network) ? '请先填写节点地址' : '请先填写 RPC 地址与 Chain ID'
      return
    }
    loading.value = true
    try {
      const meta = await fetchTokenMeta(props.network, addr)
      emit('update:modelValue', [...props.modelValue, { address: addr, ...meta }])
      address.value = ''
      message.success(`已添加 ${meta.symbol}`)
    } catch {
      error.value = '读取 Token 信息失败，请检查合约地址与 RPC'
    } finally {
      loading.value = false
    }
  }

  function remove(i) {
    emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
  }

  return { address, error, loading, onEnter, add, remove }
}
