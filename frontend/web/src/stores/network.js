import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useVaultStore } from './vault'

export const useNetworkStore = defineStore('network', () => {
  const vault = useVaultStore()

  const networks = computed(() => vault.data?.networks ?? [])
  const activeNetworkId = computed(() => vault.data?.activeNetworkId)
  const activeNetwork = computed(() => networks.value.find((n) => n.id === activeNetworkId.value) ?? networks.value[0] ?? null)

  async function setActive(id) {
    vault.data.activeNetworkId = id
    await vault.persist()
  }

  /** 新增或更新网络（按 id 判断） */
  async function saveNetwork(network) {
    const list = vault.data.networks
    const i = list.findIndex((n) => n.id === network.id)
    const normalized = {
      ...network,
      chainId: Number(network.chainId),
      tokens: (network.tokens ?? []).map((t) => ({ ...t, decimals: Number(t.decimals) })),
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

  return { networks, activeNetworkId, activeNetwork, setActive, saveNetwork, removeNetwork }
})
