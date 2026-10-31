import { computed } from 'vue'
import { useWalletStore, isWatchWallet } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

export const WATCH_HINT = '观察钱包没有私钥，不能'

/** 钱包列表：全选 / 半选、余额读取、删除。props 需要 wallets */
export function useWalletTable(props) {
  const walletStore = useWalletStore()
  const networkStore = useNetworkStore()

  const groupName = computed(() => Object.fromEntries(walletStore.groups.map((g) => [g.id, g.name])))
  const symbol = computed(() => networkStore.activeNetwork?.symbol ?? '')

  const visibleSelected = computed(() => props.wallets.filter((w) => walletStore.selectedIds.has(w.id)).length)
  const allChecked = computed(() => props.wallets.length > 0 && visibleSelected.value === props.wallets.length)
  const indeterminate = computed(() => visibleSelected.value > 0 && !allChecked.value)

  function toggleAll(checked) {
    props.wallets.forEach((w) => walletStore.toggleSelect(w.id, checked))
  }

  function balanceOf(w) {
    return networkStore.activeNetwork ? walletStore.getBalance(networkStore.activeNetwork.id, w.address) : null
  }

  async function remove(w) {
    const content = isWatchWallet(w) ? `「${w.name}」是观察钱包，删除后可以重新添加地址。` : `删除「${w.name}」后无法恢复，请确认已备份私钥。`
    const ok = await confirm({ title: '删除钱包', content, confirmText: '删除' })
    if (!ok) return
    await walletStore.removeWallets([w.id])
    message.success('已删除')
  }

  return { walletStore, networkStore, groupName, symbol, allChecked, indeterminate, toggleAll, balanceOf, remove }
}
