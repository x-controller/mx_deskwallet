import { formatUnits } from 'ethers'

const pad = (n) => String(n).padStart(2, '0')

/** 时间统一展示为 YYYY-MM-DD HH:mm:ss */
export function formatTime(ts) {
  if (!ts) return ''
  const d = new Date(ts)
  return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())} ${pad(d.getHours())}:${pad(d.getMinutes())}:${pad(d.getSeconds())}`
}

/** 地址缩略：0x1234…abcd */
export function shortAddress(address, head = 6, tail = 4) {
  if (!address) return ''
  if (address.length <= head + tail + 1) return address
  return `${address.slice(0, head)}…${address.slice(-tail)}`
}

/** 链上整数金额 → 人类可读字符串，最多保留 maxDecimals 位并去掉末尾 0 */
export function formatAmount(raw, decimals = 18, maxDecimals = 4) {
  if (raw === null || raw === undefined) return '—'
  const s = formatUnits(raw, decimals)
  const [int, frac = ''] = s.split('.')
  const cut = frac.slice(0, maxDecimals).replace(/0+$/, '')
  if (!cut) return int
  return `${int}.${cut}`
}
