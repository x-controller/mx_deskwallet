import { computed, reactive, ref, watch } from 'vue'
import { useDappStore } from '@/stores/dapp'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { chainIdOf, classifyRequest, parseTxRequest, decodeTxData, parseSignMessage, parseTypedData, estimateTxGas, executeRequest } from '@/utils/dapp'
import { waitTx, errorText } from '@/utils/chain'
import { formatAmount } from '@/utils/format'
import { message } from '@/utils/message'

export const REQUEST_TITLES = { tx: '交易请求', message: '签名请求', typedData: '结构化数据签名', switchChain: '切换网络', unsupported: '不支持的请求' }

/** dApp 会话请求审批：解析交易 / 签名 / 切链请求，估算 gas，批准或拒绝。props 需要 request */
export function useDappRequest(props) {
  const dapp = useDappStore()
  const walletStore = useWalletStore()
  const networkStore = useNetworkStore()
  const txStore = useTxStore()

  const submitting = ref(false)
  trackBusy(submitting)
  const estimate = reactive({ loading: false, gasLimit: null, fee: null, error: '' })

  const method = computed(() => props.request.params.request.method)
  const params = computed(() => props.request.params.request.params ?? [])
  const kind = computed(() => classifyRequest(method.value))
  const session = computed(() => dapp.sessionOf(props.request.topic))
  const peer = computed(() => session.value?.peer?.metadata ?? null)
  const chainId = computed(() => chainIdOf(props.request.params.chainId))
  const network = computed(() => networkStore.networks.find((n) => n.chainId === chainId.value) ?? null)
  const title = computed(() => `${REQUEST_TITLES[kind.value]} · ${peer.value?.name || 'dApp'}`)

  /** 解析结果；解析失败记入 parseError，只允许拒绝 */
  const parsed = computed(() => {
    try {
      if (kind.value === 'tx') {
        const tx = parseTxRequest(params.value[0] ?? {})
        return { tx, decoded: decodeTxData(tx, network.value?.tokens ?? []), address: tx.from }
      }
      if (kind.value === 'message') {
        const p = parseSignMessage(method.value, params.value)
        return { payload: p, address: p.address }
      }
      if (kind.value === 'typedData') {
        const p = parseTypedData(params.value)
        return { payload: p, address: p.address }
      }
      if (kind.value === 'switchChain') {
        const target = Number(params.value[0]?.chainId)
        return { targetChain: target, targetNetwork: networkStore.networks.find((n) => n.chainId === target) ?? null }
      }
      return {}
    } catch (e) {
      return { parseError: errorText(e) }
    }
  })

  const wallet = computed(() => (parsed.value.address ? walletStore.wallets.find((w) => w.address.toLowerCase() === parsed.value.address.toLowerCase()) ?? null : null))

  const blocker = computed(() => {
    if (parsed.value.parseError) return `请求参数无法解析：${parsed.value.parseError}`
    if (kind.value === 'unsupported') return `不支持的方法 ${method.value}`
    if (kind.value === 'switchChain') return parsed.value.targetNetwork ? '' : `目标链 Chain ${parsed.value.targetChain} 未配置，请先在「配置 RPC」中添加`
    if (!network.value) return `请求所在链 Chain ${chainId.value} 未配置`
    if (!wallet.value) return '请求的地址不属于本钱包，无法签名'
    if (isWatchWallet(wallet.value)) return `「${wallet.value.name}」是观察钱包，没有私钥，无法签名`
    return ''
  })

  const approveText = computed(() => (kind.value === 'tx' && method.value === 'eth_sendTransaction' ? '确认发送' : kind.value === 'switchChain' ? '切换' : '签名'))
  const isEthSign = computed(() => kind.value === 'message' && method.value === 'eth_sign')
  const isSignOnlyTx = computed(() => kind.value === 'tx' && method.value === 'eth_signTransaction')

  watch(
    () => props.request.id,
    async () => {
      Object.assign(estimate, { loading: false, gasLimit: null, fee: null, error: '' })
      if (kind.value !== 'tx' || blocker.value) return
      estimate.loading = true
      const r = await estimateTxGas(network.value, parsed.value.tx)
      Object.assign(estimate, { loading: false, ...r })
    },
    { immediate: true },
  )

  async function approve() {
    submitting.value = true
    const req = props.request
    try {
      if (kind.value === 'switchChain') {
        await dapp.respond(req, null)
        await dapp.emitChainChanged(req.topic, parsed.value.targetChain)
        message.success(`已切换到 ${parsed.value.targetNetwork.name}`)
        return
      }
      const { result, tx } = await executeRequest({ method: method.value, params: params.value, network: network.value, privateKey: wallet.value.privateKey })
      await dapp.respond(req, result)
      if (tx) {
        const t = parsed.value.tx
        const d = parsed.value.decoded
        const note = `${peer.value?.name || 'dApp'} · ${d?.kind === 'transfer' ? `转出 ${d.token?.symbol ?? 'Token'}` : d?.kind === 'approve' ? `授权 ${d.token?.symbol ?? 'Token'}` : d?.kind === 'call' ? `合约调用 ${d.selector}` : '转账'}`
        const id = txStore.add({
          kind: 'dapp',
          network: network.value,
          from: t.from,
          to: t.to || tx.to || '',
          hash: tx.hash,
          nonce: tx.nonce,
          asset: { native: true, symbol: network.value.symbol, decimals: 18 },
          amount: t.value,
          note,
        })
        message.success(`已广播 ${formatAmount(t.value, 18, 6)} ${network.value.symbol} 交易，等待确认`)
        waitTx(tx, (receipt, error) => txStore.settle(id, receipt, error))
          .then(() => message.success(`${peer.value?.name || 'dApp'} 的交易已确认`))
          .catch((e) => message.error(`${peer.value?.name || 'dApp'} 的交易失败：${errorText(e)}`))
      } else {
        message.success('已签名并返回给 dApp')
      }
    } catch (e) {
      message.error(`处理失败：${errorText(e)}`)
      await dapp.reject(req, errorText(e), 5000).catch(() => {})
    } finally {
      submitting.value = false
    }
  }

  async function reject() {
    submitting.value = true
    try {
      await dapp.reject(props.request)
    } finally {
      submitting.value = false
    }
  }

  return { dapp, submitting, estimate, method, kind, peer, chainId, network, title, parsed, wallet, blocker, approveText, isEthSign, isSignOnlyTx, approve, reject }
}
