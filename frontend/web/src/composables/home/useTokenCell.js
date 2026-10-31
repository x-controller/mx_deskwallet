import { computed } from 'vue'
import { formatAmount } from '@/utils/format'

/** 钱包行的 Token 余额单元：每个 Token 的文案、非零项、失败标记、悬停明细。props 需要 balance、tokens */
export function useTokenCell(props) {
  const rows = computed(() =>
    props.tokens.map((t) => {
      const raw = props.balance?.tokens?.[t.address.toLowerCase()]
      return {
        symbol: t.symbol,
        raw: raw === undefined ? null : raw,
        text: raw === null || raw === undefined ? '查询失败' : formatAmount(raw, t.decimals, 4),
      }
    }),
  )

  const nonZero = computed(() => rows.value.filter((r) => r.raw !== null && r.raw > 0n))
  const failed = computed(() => rows.value.some((r) => r.raw === null))
  const loaded = computed(() => !!props.balance && !props.balance.loading && !props.balance.error)
  const tooltip = computed(() => rows.value.map((r) => `${r.symbol} ${r.text}`).join('\n'))

  return { rows, nonZero, failed, loaded, tooltip }
}
