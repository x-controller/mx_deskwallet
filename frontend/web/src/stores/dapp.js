import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { useVaultStore } from './vault'

/** 对 dApp 声明的钱包信息 */
const WALLET_METADATA = {
  name: 'MX DeskWallet',
  description: '极简 EVM 桌面钱包',
  url: 'https://github.com/x-controller/mx_deskwallet',
  icons: [],
}

/** 会话里声明支持的方法；真正执行时不认识的方法会被拒绝 */
export const SUPPORTED_METHODS = [
  'eth_sendTransaction',
  'eth_signTransaction',
  'eth_sign',
  'personal_sign',
  'eth_signTypedData',
  'eth_signTypedData_v3',
  'eth_signTypedData_v4',
  'wallet_switchEthereumChain',
  'wallet_addEthereumChain',
  'eth_accounts',
  'eth_requestAccounts',
  'eth_chainId',
]
export const SUPPORTED_EVENTS = ['accountsChanged', 'chainChanged']

/**
 * dApp 连接（WalletConnect v2 / Reown WalletKit）
 * SDK 懒加载；连接请求与签名请求进入队列，由首页弹框逐条处理
 */
export const useDappStore = defineStore('dapp', () => {
  const vault = useVaultStore()

  /** idle | initializing | ready | error */
  const status = ref('idle')
  const error = ref('')
  const sessions = ref([])
  /** [{ id, params, verifyContext }] */
  const proposals = ref([])
  /** [{ id, topic, params: { request, chainId }, verifyContext }] */
  const requests = ref([])

  let kit = null
  let kitProjectId = ''

  const projectId = computed(() => vault.data?.settings?.wcProjectId ?? '')
  const ready = computed(() => status.value === 'ready')
  const currentProposal = computed(() => proposals.value[0] ?? null)
  const currentRequest = computed(() => requests.value[0] ?? null)
  const pendingCount = computed(() => proposals.value.length + requests.value.length)

  async function setProjectId(id) {
    if (!vault.data.settings) vault.data.settings = {}
    vault.data.settings.wcProjectId = id.trim()
    await vault.persist()
  }

  function refreshSessions() {
    sessions.value = kit ? Object.values(kit.getActiveSessions()) : []
  }

  const dropProposal = (id) => (proposals.value = proposals.value.filter((p) => p.id !== id))
  const dropRequest = (id) => (requests.value = requests.value.filter((r) => r.id !== id))

  async function init() {
    const id = projectId.value
    if (!id) return
    if (kit && kitProjectId === id) return
    status.value = 'initializing'
    error.value = ''
    try {
      const [{ Core }, { WalletKit }] = await Promise.all([import('@walletconnect/core'), import('@reown/walletkit')])
      kit?.events.removeAllListeners()
      const core = new Core({ projectId: id })
      kit = await WalletKit.init({ core, metadata: WALLET_METADATA })
      kitProjectId = id
      kit.on('session_proposal', (p) => proposals.value.push(p))
      kit.on('session_request', (r) => requests.value.push(r))
      kit.on('session_delete', refreshSessions)
      kit.on('proposal_expire', ({ id: pid }) => dropProposal(pid))
      kit.on('session_request_expire', ({ id: rid }) => dropRequest(rid))
      // 离线期间积压的请求
      proposals.value = Object.values(kit.getPendingSessionProposals()).map((s) => ({ id: s.id, params: s, verifyContext: null }))
      requests.value = kit.getPendingSessionRequests()
      refreshSessions()
      status.value = 'ready'
    } catch (e) {
      status.value = 'error'
      error.value = e?.message || String(e)
      throw e
    }
  }

  async function pair(uri) {
    await kit.pair({ uri: uri.trim() })
  }

  /** 批准连接：accounts 为地址数组，chainIds 为数字 chainId 数组 */
  async function approveProposal(proposal, { accounts, chainIds }) {
    const { buildApprovedNamespaces } = await import('@walletconnect/utils')
    const chains = chainIds.map((c) => `eip155:${c}`)
    const namespaces = buildApprovedNamespaces({
      proposal: proposal.params,
      supportedNamespaces: {
        eip155: {
          chains,
          methods: SUPPORTED_METHODS,
          events: SUPPORTED_EVENTS,
          accounts: chains.flatMap((c) => accounts.map((a) => `${c}:${a}`)),
        },
      },
    })
    await kit.approveSession({ id: proposal.id, namespaces })
    dropProposal(proposal.id)
    refreshSessions()
  }

  async function rejectProposal(proposal) {
    const { getSdkError } = await import('@walletconnect/utils')
    try {
      await kit.rejectSession({ id: proposal.id, reason: getSdkError('USER_REJECTED') })
    } finally {
      dropProposal(proposal.id)
    }
  }

  async function respond(request, result) {
    try {
      await kit.respondSessionRequest({ topic: request.topic, response: { id: request.id, jsonrpc: '2.0', result } })
    } finally {
      dropRequest(request.id)
    }
  }

  async function reject(request, message = '用户拒绝', code = 4001) {
    try {
      await kit.respondSessionRequest({ topic: request.topic, response: { id: request.id, jsonrpc: '2.0', error: { code, message } } })
    } finally {
      dropRequest(request.id)
    }
  }

  async function disconnect(topic) {
    const { getSdkError } = await import('@walletconnect/utils')
    await kit.disconnectSession({ topic, reason: getSdkError('USER_DISCONNECTED') })
    refreshSessions()
  }

  async function emitChainChanged(topic, chainId) {
    await kit.emitSessionEvent({ topic, event: { name: 'chainChanged', data: chainId }, chainId: `eip155:${chainId}` })
  }

  const sessionOf = (topic) => sessions.value.find((s) => s.topic === topic) ?? null

  return {
    status,
    error,
    ready,
    projectId,
    sessions,
    proposals,
    requests,
    currentProposal,
    currentRequest,
    pendingCount,
    setProjectId,
    init,
    pair,
    approveProposal,
    rejectProposal,
    respond,
    reject,
    disconnect,
    emitChainChanged,
    sessionOf,
  }
})
