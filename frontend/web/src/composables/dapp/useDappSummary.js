import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

/** 签名请求摘要：EIP-712 的 message JSON 与 domain。props 需要 kind、payload */
export function useDappSignSummary(props) {
  const typedJson = computed(() => (props.kind === 'typedData' ? JSON.stringify(props.payload.typed.message, null, 2) : ''))
  const domain = computed(() => props.payload.typed?.domain ?? {})
  const domainText = computed(() => {
    const d = domain.value
    let s = d.name || '—'
    if (d.version) s += ` v${d.version}`
    if (d.chainId) s += ` · Chain ${d.chainId}`
    return s
  })
  return { typedJson, domain, domainText }
}

/** 交易请求摘要：目标 Token 名、金额文案、手续费文案。props 需要 tx、decoded、network、estimate */
export function useDappTxSummary(props) {
  const symbol = computed(() => props.network?.symbol ?? '')
  const tokenLabel = (d) => d.token?.symbol ?? '未知 Token'
  const amountText = (d) => (d.token ? `${formatAmount(d.amount, d.token.decimals, 6)} ${d.token.symbol}` : `${d.amount.toString()}（原始单位）`)
  const knownTarget = computed(() => !!props.decoded?.token)
  const valueText = computed(() => `${formatAmount(props.tx.value, 18, 8)} ${symbol.value}`)
  const showValue = computed(() => props.tx.value > 0n || !props.decoded)
  const dataBytes = computed(() => (props.tx.data.length - 2) / 2)
  const feeText = computed(() => (props.estimate.fee === null || props.estimate.fee === undefined ? '' : `≤ ${formatAmount(props.estimate.fee, 18, 8)} ${symbol.value} · gas ${props.estimate.gasLimit}`))
  return { symbol, tokenLabel, amountText, knownTarget, valueText, showValue, dataBytes, feeText }
}
