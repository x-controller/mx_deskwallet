import { computed, reactive, ref, watch } from 'vue'
import { useNetworkStore } from '@/stores/network'
import { detectChainId } from '@/utils/chain'
import { detectNode } from '@/utils/tron'
import { validate, rules } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

/** 配置 RPC 弹框：网络列表选择、表单、检测 Chain ID、保存 / 删除。props 需要 modelValue */
export function useNetworkForm(props) {
  const networkStore = useNetworkStore()

  const emptyForm = () => ({ id: crypto.randomUUID(), type: 'evm', name: '', rpcUrl: '', apiKey: '', chainId: '', symbol: '', tokens: [], dexes: [] })

  /** 链类型选项 */
  const typeOptions = [
    { label: 'EVM（Ethereum / BSC 等）', value: 'evm' },
    { label: 'Tron（波场）', value: 'tron' },
  ]

  /** 当前编辑的网络 id；新建时为 'new' */
  const selectedId = ref('')
  const form = reactive(emptyForm())
  const errors = ref({})
  const saving = ref(false)
  const detecting = ref(false)

  const isNew = computed(() => selectedId.value === 'new')
  const isTron = computed(() => form.type === 'tron')
  const rpcPlaceholder = computed(() => (isTron.value ? 'https://api.trongrid.io' : 'https://...'))
  const detectHint = computed(() => (isTron.value ? '检测节点并读取区块高度' : '检测 RPC 并读取 Chain ID'))
  const symbolPlaceholder = computed(() => (isTron.value ? 'TRX' : 'ETH'))

  function load(network) {
    // 先铺一层空表单，避免旧网络缺字段时残留上一个网络的值
    Object.assign(form, emptyForm(), JSON.parse(JSON.stringify(network)))
    form.chainId = network.type === 'tron' ? '' : String(network.chainId ?? '')
    errors.value = {}
  }

  function select(id) {
    const n = networkStore.networks.find((x) => x.id === id)
    if (!n) return
    selectedId.value = id
    load(n)
  }

  function createNew() {
    selectedId.value = 'new'
    load(emptyForm())
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v) return
      if (networkStore.activeNetwork) select(networkStore.activeNetwork.id)
      else createNew()
    },
  )

  async function detect() {
    if (rules.url()(form.rpcUrl)) {
      errors.value = { ...errors.value, rpcUrl: rules.url()(form.rpcUrl) }
      return
    }
    detecting.value = true
    try {
      if (isTron.value) {
        const height = await detectNode(form.rpcUrl.trim(), form.apiKey.trim())
        errors.value = { ...errors.value, rpcUrl: '' }
        message.success(`节点可用，当前区块 ${height}`)
      } else {
        const id = await detectChainId(form.rpcUrl.trim())
        form.chainId = String(id)
        errors.value = { ...errors.value, rpcUrl: '', chainId: '' }
        message.success(`RPC 可用，Chain ID ${id}`)
      }
    } catch (e) {
      errors.value = { ...errors.value, rpcUrl: `${isTron.value ? '节点' : 'RPC'}不可用：${e?.shortMessage || e?.message || '连接失败'}` }
    } finally {
      detecting.value = false
    }
  }

  async function save() {
    errors.value = validate(form, {
      name: [rules.required('请输入网络名称')],
      rpcUrl: [rules.required(isTron.value ? '请输入节点地址' : '请输入 RPC 地址'), rules.url()],
      chainId: isTron.value ? [] : [rules.required('请输入 Chain ID'), rules.positiveInt()],
      symbol: [rules.required('请输入原生币符号')],
    })
    if (Object.keys(errors.value).length) return
    saving.value = true
    try {
      const saved = await networkStore.saveNetwork({ ...form, name: form.name.trim(), rpcUrl: form.rpcUrl.trim(), symbol: form.symbol.trim() })
      selectedId.value = saved.id
      message.success('已保存')
    } finally {
      saving.value = false
    }
  }

  async function remove() {
    const ok = await confirm({ title: '删除网络', content: `确定删除网络「${form.name}」？`, confirmText: '删除' })
    if (!ok) return
    await networkStore.removeNetwork(selectedId.value)
    message.success('已删除')
    if (networkStore.networks.length) select(networkStore.networks[0].id)
    else createNew()
  }

  return { networkStore, selectedId, form, errors, saving, detecting, isNew, isTron, typeOptions, rpcPlaceholder, detectHint, symbolPlaceholder, select, createNew, detect, save, remove }
}
