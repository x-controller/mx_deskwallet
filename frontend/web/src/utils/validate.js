import { isAddress, getAddress } from 'ethers'
import { isTron, isTronAddress, fromTronAddress } from './tron'

const PRIVATE_KEY_RE = /^(0x)?[0-9a-fA-F]{64}$/

export const isPrivateKey = (s) => PRIVATE_KEY_RE.test(String(s || '').trim())
export const isEvmAddress = (s) => isAddress(String(s || '').trim())
export { isTronAddress }
/** 当前网络要求的地址写法：Tron 用 T 开头 base58，其余 0x 十六进制 */
export const isChainAddress = (network, s) => (isTron(network) ? isTronAddress(s) : isEvmAddress(s))
/** 任一写法的地址（导入观察钱包用：两种写法指向同一把私钥的同一个账户） */
export const isAnyAddress = (s) => isEvmAddress(s) || isTronAddress(s)
/** 任一写法 → 用于比对的小写 0x 地址；解析不了的原样小写（交易记录里的收款方可能是 T 地址） */
export const addressKey = (s) => {
  try {
    return normalizeAddress(s).toLowerCase()
  } catch {
    return String(s ?? '').toLowerCase()
  }
}
/** 任一写法 → 金库里统一保存的 0x 校验和地址 */
export const normalizeAddress = (s) => (isTronAddress(s) ? fromTronAddress(s) : getAddress(String(s).trim()))
export const isHttpUrl = (s) => /^(https?|wss?):\/\/\S+$/i.test(String(s || '').trim())
export const isPositiveInt = (v) => Number.isInteger(Number(v)) && Number(v) > 0

/**
 * 通用校验规则，每条规则返回错误文案或 '' 表示通过
 */
export const rules = {
  required: (msg = '不能为空') => (v) => (String(v ?? '').trim() ? '' : msg),
  address: (msg = '地址格式不正确') => (v) => (isEvmAddress(v) ? '' : msg),
  /** 按网络校验地址写法（getter 延迟取网络，便于响应式） */
  chainAddress: (getNetwork, msg) => (v) => {
    const n = getNetwork()
    if (isChainAddress(n, v)) return ''
    return msg || (isTron(n) ? '地址格式不正确，Tron 地址以 T 开头' : '地址格式不正确')
  },
  url: (msg = 'RPC 地址须以 http(s):// 开头') => (v) => (isHttpUrl(v) ? '' : msg),
  positiveInt: (msg = '须为正整数') => (v) => (isPositiveInt(v) ? '' : msg),
  range: (min, max, msg) => (v) => (Number(v) >= min && Number(v) <= max ? '' : msg || `须在 ${min} ~ ${max} 之间`),
  minLength: (n, msg) => (v) => (String(v ?? '').length >= n ? '' : msg || `至少 ${n} 个字符`),
  /** 与另一个值一致（getter 延迟取值，便于对比响应式字段） */
  same: (getOther, msg = '两次输入不一致') => (v) => (v === getOther() ? '' : msg),
}

/**
 * 按 schema 校验表单，返回 { field: errorMessage }，没有错误时为空对象
 * schema: { field: [rule, rule, ...] }
 */
export function validate(values, schema) {
  const errors = {}
  for (const [field, fieldRules] of Object.entries(schema)) {
    for (const rule of fieldRules) {
      const err = rule(values[field])
      if (err) {
        errors[field] = err
        break
      }
    }
  }
  return errors
}
