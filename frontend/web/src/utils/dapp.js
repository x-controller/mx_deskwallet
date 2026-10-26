import { Interface, Wallet, MaxUint256, getBytes, isHexString, toUtf8String, getAddress } from 'ethers'
import { getProvider, ERC20_ABI, errorText } from './chain'

/** 'eip155:56' → 56 */
export const chainIdOf = (caip) => Number(String(caip ?? '').split(':')[1])

const erc20 = new Interface(ERC20_ABI)

const toBigInt = (v) => (v === undefined || v === null || v === '' ? 0n : BigInt(v))

/** 把 dApp 传来的交易对象规范化：地址 checksum，数值转 bigint */
export function parseTxRequest(raw) {
  return {
    from: raw.from ? getAddress(raw.from) : '',
    to: raw.to ? getAddress(raw.to) : '',
    value: toBigInt(raw.value),
    data: raw.data && raw.data !== '0x' ? raw.data : '0x',
    gasLimit: raw.gas ? toBigInt(raw.gas) : raw.gasLimit ? toBigInt(raw.gasLimit) : null,
    nonce: raw.nonce !== undefined ? Number(raw.nonce) : undefined,
  }
}

/**
 * 解码常见调用：ERC-20 transfer / approve 显示成人话，其余只给方法选择器
 * tokens：当前网络配置的 Token，用来补符号与精度
 */
export function decodeTxData(tx, tokens = []) {
  if (tx.data === '0x') return null
  const token = tokens.find((t) => t.address.toLowerCase() === tx.to.toLowerCase())
  try {
    const parsed = erc20.parseTransaction({ data: tx.data })
    if (parsed?.name === 'transfer') return { kind: 'transfer', to: parsed.args[0], amount: parsed.args[1], token }
    if (parsed?.name === 'approve') return { kind: 'approve', spender: parsed.args[0], amount: parsed.args[1], unlimited: parsed.args[1] === MaxUint256, token }
  } catch {
    /* 不是 ERC-20 调用 */
  }
  return { kind: 'call', selector: tx.data.slice(0, 10) }
}

/** personal_sign / eth_sign 的参数两种顺序都兼容，返回 { address, hex, text } */
export function parseSignMessage(method, params) {
  const [a, b] = params
  const isAddr = (s) => typeof s === 'string' && /^0x[0-9a-fA-F]{40}$/.test(s)
  const address = method === 'eth_sign' ? (isAddr(a) ? a : b) : isAddr(b) ? b : a
  const message = address === a ? b : a
  let text = null
  if (isHexString(message)) {
    try {
      text = toUtf8String(message)
    } catch {
      text = null
    }
  } else {
    text = message
  }
  return { address: getAddress(address), message, text }
}

/** eth_signTypedData*：params 为 [address, json]，返回 { address, typed }（types 去掉 EIP712Domain 供 ethers 使用） */
export function parseTypedData(params) {
  const [a, b] = params
  const address = /^0x[0-9a-fA-F]{40}$/.test(String(a)) ? a : b
  const raw = address === a ? b : a
  const typed = typeof raw === 'string' ? JSON.parse(raw) : raw
  const { EIP712Domain, ...types } = typed.types ?? {}
  return { address: getAddress(address), typed: { ...typed, types } }
}

/** 请求分类，弹框按 kind 渲染 */
export function classifyRequest(method) {
  if (method === 'eth_sendTransaction' || method === 'eth_signTransaction') return 'tx'
  if (method === 'personal_sign' || method === 'eth_sign') return 'message'
  if (method.startsWith('eth_signTypedData')) return 'typedData'
  if (method === 'wallet_switchEthereumChain') return 'switchChain'
  return 'unsupported'
}

/** 估算 gas，失败（通常是会回滚）返回错误文案 */
export async function estimateTxGas(network, tx) {
  try {
    const gas = await getProvider(network).estimateGas({ from: tx.from, to: tx.to || undefined, data: tx.data, value: tx.value })
    const fee = await getProvider(network).getFeeData()
    return { gasLimit: gas, fee: gas * (fee.maxFeePerGas ?? fee.gasPrice ?? 0n), error: '' }
  } catch (e) {
    return { gasLimit: null, fee: null, error: errorText(e) }
  }
}

/**
 * 执行已批准的签名类请求
 * 返回 JSON-RPC result；eth_sendTransaction 额外返回 tx 响应供记录
 */
export async function executeRequest({ method, params, network, privateKey }) {
  const wallet = new Wallet(privateKey, getProvider(network))
  switch (method) {
    case 'eth_sendTransaction': {
      const tx = parseTxRequest(params[0])
      const sent = await wallet.sendTransaction({ to: tx.to || undefined, data: tx.data, value: tx.value, ...(tx.gasLimit ? { gasLimit: tx.gasLimit } : {}) })
      return { result: sent.hash, tx: sent }
    }
    case 'eth_signTransaction': {
      const tx = parseTxRequest(params[0])
      const populated = await wallet.populateTransaction({ to: tx.to || undefined, data: tx.data, value: tx.value, ...(tx.gasLimit ? { gasLimit: tx.gasLimit } : {}) })
      return { result: await wallet.signTransaction(populated) }
    }
    case 'personal_sign':
    case 'eth_sign': {
      const { message } = parseSignMessage(method, params)
      return { result: await wallet.signMessage(isHexString(message) ? getBytes(message) : message) }
    }
    case 'eth_signTypedData':
    case 'eth_signTypedData_v3':
    case 'eth_signTypedData_v4': {
      const { typed } = parseTypedData(params)
      return { result: await wallet.signTypedData(typed.domain, typed.types, typed.message) }
    }
    default:
      throw new Error(`不支持的方法 ${method}`)
  }
}

/** 校验状态文案 */
export function verifyLabel(verifyContext) {
  const v = verifyContext?.verified
  if (!v) return { type: 'default', text: '未校验' }
  if (v.isScam) return { type: 'danger', text: '疑似钓鱼站' }
  if (v.validation === 'VALID') return { type: 'info', text: '域名已校验' }
  if (v.validation === 'INVALID') return { type: 'danger', text: '域名不匹配' }
  return { type: 'default', text: '域名未校验' }
}
