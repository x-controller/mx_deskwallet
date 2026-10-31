import { computed } from 'vue'
import { useWalletStore } from '@/stores/wallet'
import { useNetworkStore } from '@/stores/network'
import { useTxStore } from '@/stores/tx'
import { useUpdateStore } from '@/stores/update'
import { isTron } from '@/utils/chain'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

/** 状态栏：选中批量操作（移组 / 删除）、清空交易记录、手动检查更新。props 需要 mode */
export function useStatusBar(props) {
  const walletStore = useWalletStore()
  const networkStore = useNetworkStore()
  const txStore = useTxStore()
  const updateStore = useUpdateStore()

  const isHistory = computed(() => props.mode === 'history')
  const selectedCount = computed(() => walletStore.selectedIds.size)
  const groupOptions = computed(() => walletStore.groups.map((g) => ({ label: g.name, value: g.id })))
  /** 状态栏右侧的链标识：EVM 显示 Chain ID，Tron 显示链类型 */
  const chainLabel = computed(() => {
    const n = networkStore.activeNetwork
    if (!n) return ''
    return isTron(n) ? 'Tron' : `Chain ID ${n.chainId}`
  })

  async function moveTo(groupId) {
    const ids = [...walletStore.selectedIds]
    for (const id of ids) await walletStore.updateWallet(id, { groupId })
    message.success(`已移动 ${ids.length} 个钱包`)
  }

  async function removeSelected() {
    const ids = [...walletStore.selectedIds]
    const ok = await confirm({ title: '删除钱包', content: `将删除选中的 ${ids.length} 个钱包，无法恢复，请确认普通钱包已备份私钥。`, confirmText: '删除' })
    if (!ok) return
    await walletStore.removeWallets(ids)
    message.success(`已删除 ${ids.length} 个钱包`)
  }

  async function clearTxs() {
    const ok = await confirm({
      title: '清空交易记录',
      content: `将删除全部 ${txStore.txs.length} 条交易记录（只删除本地记录，不影响链上交易）。`,
      confirmText: '清空',
    })
    if (!ok) return
    await txStore.clear()
    message.success('交易记录已清空')
  }

  async function checkUpdate() {
    try {
      const update = await updateStore.check()
      if (update) updateStore.install()
      else message.success('已经是最新版本')
    } catch (e) {
      message.error(e?.message || String(e))
    }
  }

  return { walletStore, networkStore, txStore, updateStore, isHistory, selectedCount, groupOptions, chainLabel, moveTo, removeSelected, clearTxs, checkUpdate }
}
