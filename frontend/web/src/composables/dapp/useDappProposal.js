import { computed, ref, watch } from 'vue'
import { useDappStore } from '@/stores/dapp'
import { useWalletStore } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { chainIdOf } from '@/utils/dapp'
import { message } from '@/utils/message'

/** dApp 连接请求：选择暴露的钱包与网络，批准 / 拒绝。props 需要 proposal */
export function useDappProposal(props) {
  const dapp = useDappStore()
  const walletStore = useWalletStore()
  const networkStore = useNetworkStore()

  const selectedWallets = ref(new Set())
  const selectedChains = ref(new Set())
  const submitting = ref(false)

  const metadata = computed(() => props.proposal.params?.proposer?.metadata ?? null)
  const requiredChains = computed(() => (props.proposal.params?.requiredNamespaces?.eip155?.chains ?? []).map(chainIdOf))
  const optionalChains = computed(() => (props.proposal.params?.optionalNamespaces?.eip155?.chains ?? []).map(chainIdOf).filter((c) => !requiredChains.value.includes(c)))
  const knownChain = (c) => networkStore.networks.some((n) => n.chainId === c)
  const networkName = (c) => networkStore.networks.find((n) => n.chainId === c)?.name ?? `Chain ${c}`
  const missingRequired = computed(() => requiredChains.value.filter((c) => !knownChain(c)))
  const isScam = computed(() => !!props.proposal.verifyContext?.verified?.isScam)

  /** dApp 没指定任何链时，让用户从自己配置的网络里挑 */
  const chainChoices = computed(() => {
    const listed = [...requiredChains.value, ...optionalChains.value]
    return listed.length ? listed : networkStore.networks.map((n) => n.chainId)
  })

  const canApprove = computed(() => !submitting.value && !missingRequired.value.length && selectedWallets.value.size > 0 && selectedChains.value.size > 0)

  watch(
    () => props.proposal.id,
    () => {
      selectedWallets.value = new Set(walletStore.signableWallets.slice(0, 1).map((w) => w.id))
      selectedChains.value = new Set(chainChoices.value.filter(knownChain))
    },
    { immediate: true },
  )

  function toggle(set, key, on) {
    const next = new Set(set.value)
    on ? next.add(key) : next.delete(key)
    set.value = next
  }
  const toggleWallet = (id, on) => toggle(selectedWallets, id, on)
  const toggleChain = (c, on) => toggle(selectedChains, c, on)

  async function approve() {
    submitting.value = true
    try {
      const accounts = walletStore.signableWallets.filter((w) => selectedWallets.value.has(w.id)).map((w) => w.address)
      await dapp.approveProposal(props.proposal, { accounts, chainIds: [...selectedChains.value] })
      message.success(`已连接 ${metadata.value?.name || 'dApp'}`)
    } catch (e) {
      message.error(`连接失败：${e?.message || e}`)
    } finally {
      submitting.value = false
    }
  }

  async function reject() {
    submitting.value = true
    try {
      await dapp.rejectProposal(props.proposal)
    } finally {
      submitting.value = false
    }
  }

  return { walletStore, selectedWallets, selectedChains, submitting, metadata, requiredChains, knownChain, networkName, missingRequired, isScam, chainChoices, canApprove, toggleWallet, toggleChain, approve, reject }
}
