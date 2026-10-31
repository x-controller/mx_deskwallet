import { computed } from 'vue'
import { MaxUint256 } from 'ethers'
import { formatAmount, formatTime } from '@/utils/format'

export const TX_KIND = { transfer: '转账', drain: '清空', approve: '授权', swap: '兑换', dapp: 'dApp' }

export const TX_STATUS = {
  pending: { text: '待确认' },
  success: { text: '成功' },
  failed: { text: '失败' },
  dropped: { text: '已丢弃' },
}

/** 交易记录行的展示文案：双方名称、金额、悬停明细。props 需要 tx、walletNames */
export function useTxRow(props) {
  const fromName = computed(() => props.walletNames[props.tx.from.toLowerCase()] || '')
  const toName = computed(() => props.walletNames[props.tx.to.toLowerCase()] || '')
  const kindText = computed(() => TX_KIND[props.tx.kind] || props.tx.kind)

  /** 金额列：授权显示额度（无限 / 具体数量），兑换显示 卖出 → 预计买入，其余显示转出数量 */
  const amountText = computed(() => {
    const t = props.tx
    if (t.kind === 'approve') return BigInt(t.amount) === MaxUint256 ? '无限额度' : formatAmount(t.amount, t.asset.decimals, 6)
    return formatAmount(t.amount, t.asset.decimals, 6)
  })
  const amountOutText = computed(() => (props.tx.toAsset && props.tx.amountOut ? `≈ ${formatAmount(props.tx.amountOut, props.tx.toAsset.decimals, 6)}` : ''))
  const amountTooltip = computed(() => (amountOutText.value ? `${amountText.value} ${props.tx.asset.symbol} → ${amountOutText.value} ${props.tx.toAsset.symbol}` : ''))

  const detail = computed(() => {
    const t = props.tx
    const lines = []
    if (t.note) lines.push(t.note)
    if (t.fee) lines.push(`手续费 ${formatAmount(t.fee, 18, 8)} ${t.nativeSymbol}`)
    if (t.blockNumber) lines.push(`区块 ${t.blockNumber}`)
    if (t.settledAt) lines.push(`确认于 ${formatTime(t.settledAt)}`)
    if (t.error) lines.push(t.error)
    return lines.join('\n')
  })

  return { fromName, toName, kindText, amountText, amountOutText, amountTooltip, detail }
}
