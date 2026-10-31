import { computed } from 'vue'
import { formatAmount, shortAddress } from '@/utils/format'
import { feeTierLabel } from '@/utils/dex'

const PRICE_IMPACT_WARN = 3

/** 报价面板的展示文案：路径、价格影响、预计 / 最少到手。props 需要 quote、toAsset、symbols */
export function useSwapQuote(props) {
  /** 路径文案：V3 在两跳之间标出池子手续费档位，如 WETH →0.3%→ USDC */
  const pathText = computed(() => {
    const names = (props.quote.path ?? []).map((a) => props.symbols[a.toLowerCase()] || shortAddress(a))
    const fees = props.quote.fees ?? []
    return names.map((n, i) => (i < names.length - 1 ? `${n} →${fees[i] !== undefined ? feeTierLabel(fees[i]) : ''}→ ` : n)).join('')
  })
  const impactText = computed(() => (props.quote.priceImpact === null || props.quote.priceImpact === undefined ? '—' : `${props.quote.priceImpact.toFixed(2)}%`))
  const impactHigh = computed(() => (props.quote.priceImpact ?? 0) >= PRICE_IMPACT_WARN)
  const hasQuote = computed(() => props.quote.amountOut !== null && !!props.toAsset)
  const amountOutText = computed(() => (hasQuote.value ? `${formatAmount(props.quote.amountOut, props.toAsset.decimals, 6)} ${props.toAsset.symbol}` : ''))
  const amountOutMinText = computed(() => (hasQuote.value ? `${formatAmount(props.quote.amountOutMin, props.toAsset.decimals, 6)} ${props.toAsset.symbol}` : ''))

  return { pathText, impactText, impactHigh, hasQuote, amountOutText, amountOutMinText }
}
