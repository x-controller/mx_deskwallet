import { computed, ref, watch } from 'vue'
import { useTxStore } from '@/stores/tx'
import { useWalletStore } from '@/stores/wallet'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

/** 交易记录表：分页、地址 → 钱包名、删除记录。props 需要 txs */
export function useTxTable(props) {
  const txStore = useTxStore()
  const walletStore = useWalletStore()

  const page = ref(1)
  const pageSize = ref(20)

  const walletNames = computed(() => Object.fromEntries(walletStore.wallets.map((w) => [w.address.toLowerCase(), w.name])))
  const paged = computed(() => props.txs.slice((page.value - 1) * pageSize.value, page.value * pageSize.value))

  /* 筛选结果变少时把页码拉回有效范围 */
  watch(
    () => props.txs.length,
    (n) => {
      const pages = Math.max(1, Math.ceil(n / pageSize.value))
      if (page.value > pages) page.value = pages
    },
  )

  async function remove(tx) {
    if (tx.status === 'pending') {
      const ok = await confirm({ title: '删除记录', content: '这笔交易还在等待确认，删除后将不再跟踪其状态。', confirmText: '删除' })
      if (!ok) return
    }
    await txStore.remove([tx.id])
    message.success('已删除')
  }

  return { page, pageSize, walletNames, paged, remove }
}
