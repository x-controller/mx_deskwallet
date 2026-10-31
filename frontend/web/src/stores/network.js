import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useVaultStore } from './vault'

export const useNetworkStore = defineStore('network', () => {
  const vault = useVaultStore()

  const networks = computed(() => vault.data?.networks ?? [])
  const activeNetworkId = computed(() => vault.data?.activeNetworkId)
  const activeNetwork = computed(() => networks.value.find((n) => n.id === activeNetworkId.value) ?? networks.value[0] ?? null)
  /** EVM 网络（dApp 连接只支持 eip155） */
  const evmNetworks = computed(() => networks.value.filter((n) => n.type !== 'tron'))

  async function setActive(id) {
    vault.data.activeNetworkId = id
    await vault.persist()
  }

  /** 新增或更新网络（按 id 判断） */
  async function saveNetwork(network) {
    const list = vault.data.networks
    const i = list.findIndex((n) => n.id === network.id)
    const isTron = network.type === 'tron'
    const normalized = {
      ...network,
      type: isTron ? 'tron' : 'evm',
      chainId: isTron ? 0 : Number(network.chainId),
      decimals: isTron ? 6 : 18,
      apiKey: isTron ? String(network.apiKey ?? '').trim() : '',
      tokens: (network.tokens ?? []).map((t) => ({ ...t, decimals: Number(t.decimals) })),
      dexes: (isTron ? [] : network.dexes ?? []).map((d) =>
        d.version === 'v3'
          ? { id: d.id, name: d.name, version: 'v3', router: d.router, quoter: d.quoter, wrappedNative: d.wrappedNative, feeTiers: (d.feeTiers ?? []).map(Number) }
          : { id: d.id, name: d.name, version: 'v2', router: d.router, wrappedNative: d.wrappedNative },
      ),
    }
    if (i >= 0) list[i] = normalized
    else list.push(normalized)
    if (!vault.data.activeNetworkId) vault.data.activeNetworkId = normalized.id
    await vault.persist()
    return normalized
  }

  async function removeNetwork(id) {
    vault.data.networks = vault.data.networks.filter((n) => n.id !== id)
    if (vault.data.activeNetworkId === id) vault.data.activeNetworkId = vault.data.networks[0]?.id ?? null
    await vault.persist()
  }

  return { networks, evmNetworks, activeNetworkId, activeNetwork, setActive, saveNetwork, removeNetwork }
})
