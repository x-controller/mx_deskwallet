/**
 * Tron（波场）链上实现：地址转换、HTTP 节点接口、余额、费用估算（能量 / 带宽）、构造 / 签名 / 广播交易、回执轮询。
 * 对外函数的签名与 chain.js 的 EVM 实现一致，由 chain.js 按网络类型分发；钱包地址在金库里统一存 EVM 十六进制，
 * 这里按需转换成 T 开头的 base58 地址（两者是同一把私钥、同样的 20 字节）。
 */
import { SigningKey, sha256, getBytes, hexlify, concat, encodeBase58, decodeBase58, toBeHex, zeroPadValue, getAddress, AbiCoder, Interface, toUtf8String, formatUnits, computeAddress as ethersComputeAddress } from 'ethers'
import { isTauri } from './storage'
import { errorText, sleep } from './async'

export const TRX_DECIMALS = 6
const SUN = 1_000_000n
const ADDRESS_PREFIX = '0x41'
const TRC20_ABI = ['function balanceOf(address) view returns (uint256)', 'function transfer(address to, uint256 amount) returns (bool)', 'function decimals() view returns (uint8)', 'function symbol() view returns (string)']
const iface = new Interface(TRC20_ABI)
const abi = AbiCoder.defaultAbiCoder()

/** 粗略的交易体积（字节），用于带宽估算：TRX 转账约 270，TRC-20 转账约 350 */
const TX_BYTES = { trx: 270n, trc20: 350n }
/** 交易在链上找不到时等多久判定过期（节点默认 60 秒过期，再留一点余量） */
const EXPIRE_GRACE_MS = 90_000
const POLL_MS = 3000
/** 链参数缓存时长 */
const PARAMS_TTL = 10 * 60 * 1000

export const isTron = (network) => network?.type === 'tron'

/* ---------- 地址 ---------- */

/** EVM 十六进制地址 → T 开头的 base58 地址 */
export function toTronAddress(hex) {
  const bytes = getBytes(ADDRESS_PREFIX + getAddress(hex).slice(2))
  const check = getBytes(sha256(sha256(bytes))).slice(0, 4)
  return encodeBase58(concat([bytes, check]))
}

/** T 开头的 base58 地址 → EVM 校验和十六进制地址；格式不对抛错 */
export function fromTronAddress(b58) {
  const s = String(b58 ?? '').trim()
  if (!/^T[1-9A-HJ-NP-Za-km-z]{33}$/.test(s)) throw new Error('bad tron address')
  const bytes = getBytes(zeroPadValue(toBeHex(decodeBase58(s)), 25))
  if (bytes[0] !== 0x41) throw new Error('bad tron address prefix')
  const body = bytes.slice(0, 21)
  const check = getBytes(sha256(sha256(body))).slice(0, 4)
  if (hexlify(check) !== hexlify(bytes.slice(21))) throw new Error('bad tron address checksum')
  return getAddress(hexlify(body.slice(1)))
}

export function isTronAddress(s) {
  try {
    fromTronAddress(s)
    return true
  } catch {
    return false
  }
}

/** 任意写法（T 地址 / 0x 地址）→ 节点接口用的 41 前缀十六进制 */
function toHex41(addr) {
  const s = String(addr).trim()
  const hex = s.startsWith('0x') || s.startsWith('0X') ? getAddress(s) : fromTronAddress(s)
  return '41' + hex.slice(2).toLowerCase()
}

/** 任意写法 → 0x 校验和地址（ABI 参数用） */
const toHex20 = (addr) => '0x' + toHex41(addr).slice(2)

/* ---------- 节点接口 ---------- */

async function post(network, path, body) {
  const url = `${network.rpcUrl.replace(/\/+$/, '')}/${path}`
  const headers = { 'Content-Type': 'application/json' }
  if (network.apiKey) headers['TRON-PRO-API-KEY'] = network.apiKey
  const init = { method: 'POST', headers, body: JSON.stringify({ visible: false, ...body }) }
  const doFetch = isTauri ? (await import('@tauri-apps/plugin-http')).fetch : fetch
  const res = await doFetch(url, init)
  if (!res.ok) throw new Error(`节点返回 HTTP ${res.status}`)
  const data = await res.json()
  if (data?.Error) throw new Error(cleanNodeError(data.Error))
  return data
}

/** 节点错误形如 "class org.tron.core.exception.ContractValidateException : Validate TransferContract error, balance is not sufficient." */
function cleanNodeError(text) {
  return String(text).replace(/^class [\w.$]+ : /, '')
}

const hexMessage = (m) => {
  if (!m) return ''
  try {
    return toUtf8String('0x' + m)
  } catch {
    return String(m)
  }
}

/** 探测节点：返回当前区块高度 */
export async function detectNode(rpcUrl, apiKey = '') {
  const data = await post({ rpcUrl, apiKey }, 'wallet/getnowblock', {})
  const height = data?.block_header?.raw_data?.number
  if (height === undefined) throw new Error('不是 Tron 节点接口')
  return Number(height)
}

/* ---------- 链参数与资源 ---------- */

const paramsCache = new Map()

/** 能量 / 带宽单价与建新账户费用（sun） */
async function chainParams(network) {
  const key = network.rpcUrl
  const hit = paramsCache.get(key)
  if (hit && Date.now() - hit.at < PARAMS_TTL) return hit.value
  const data = await post(network, 'wallet/getchainparameters', {})
  const map = Object.fromEntries((data.chainParameter ?? []).map((p) => [p.key, BigInt(p.value ?? 0)]))
  const value = {
    energyFee: map.getEnergyFee ?? 420n,
    bandwidthFee: map.getTransactionFee ?? 1000n,
    newAccountFee: (map.getCreateNewAccountFeeInSystemContract ?? 1_000_000n) + (map.getCreateAccountFee ?? 100_000n),
  }
  paramsCache.set(key, { at: Date.now(), value })
  return value
}

/** 账户当前可用的能量与带宽 */
async function resources(network, address) {
  const r = await post(network, 'wallet/getaccountresource', { address: toHex41(address) })
  const n = (k) => BigInt(r[k] ?? 0)
  return {
    energy: n('EnergyLimit') - n('EnergyUsed'),
    bandwidth: n('freeNetLimit') - n('freeNetUsed') + n('NetLimit') - n('NetUsed'),
  }
}

async function accountExists(network, address) {
  const r = await post(network, 'wallet/getaccount', { address: toHex41(address) })
  return !!r?.address
}

/* ---------- 余额与 Token 元数据 ---------- */

export async function fetchNativeBalance(network, address) {
  const r = await post(network, 'wallet/getaccount', { address: toHex41(address) })
  return BigInt(r?.balance ?? 0)
}

/** 只读调用合约，返回 { result: 0x 返回值, energy: 预计能量 } */
async function constantCall(network, { owner, contract, selector, params, types }) {
  const r = await post(network, 'wallet/triggerconstantcontract', {
    owner_address: toHex41(owner),
    contract_address: toHex41(contract),
    function_selector: selector,
    parameter: abi.encode(types, params).slice(2),
  })
  if (r?.result?.result !== true) throw new Error(hexMessage(r?.result?.message) || '合约调用失败')
  const ret = r.transaction?.ret?.[0]?.ret
  if (ret && ret !== 'SUCCESS') throw new Error(`合约执行失败：${ret}`)
  if (r.receipt?.result && r.receipt.result !== 'SUCCESS') throw new Error(`合约执行失败：${r.receipt.result}`)
  return { result: '0x' + (r.constant_result?.[0] ?? ''), energy: BigInt(r.energy_used ?? 0) }
}

const ZERO_OWNER = '0x0000000000000000000000000000000000000000'

export async function fetchTokenBalance(network, tokenAddress, address) {
  const { result } = await constantCall(network, { owner: address, contract: tokenAddress, selector: 'balanceOf(address)', types: ['address'], params: [toHex20(address)] })
  return abi.decode(['uint256'], result)[0]
}

export async function fetchTokenMeta(network, tokenAddress) {
  const [sym, dec] = await Promise.all([
    constantCall(network, { owner: ZERO_OWNER, contract: tokenAddress, selector: 'symbol()', types: [], params: [] }),
    constantCall(network, { owner: ZERO_OWNER, contract: tokenAddress, selector: 'decimals()', types: [], params: [] }),
  ])
  return { symbol: abi.decode(['string'], sym.result)[0], decimals: Number(abi.decode(['uint8'], dec.result)[0]) }
}

/* ---------- 费用估算 ---------- */

/**
 * 估算一笔转账的费用（按资源不够时全部烧 TRX 计，是上限）
 * count：同一钱包接下来要发几笔同类交易，可用能量 / 带宽会被这些交易共同消耗，返回的 fee 是均摊到每笔的费用
 * 返回 { gasLimit: 能量, price: 能量单价, fee: 最高费用(sun), feeData: { feeLimit, energy, bandwidth, newAccount } }
 */
export async function estimateTransfer({ network, from, to, asset, amount, count = 1 }) {
  const [params, res] = await Promise.all([chainParams(network), resources(network, from)])
  let energy = 0n
  let bytes = TX_BYTES.trx
  let fee = 0n
  if (asset.native) {
    if (!(await accountExists(network, to))) fee += params.newAccountFee
  } else {
    const r = await constantCall(network, { owner: from, contract: asset.address, selector: 'transfer(address,uint256)', types: ['address', 'uint256'], params: [toHex20(to), amount] })
    energy = r.energy
    bytes = TX_BYTES.trc20
  }
  const n = BigInt(Math.max(1, count))
  const burnEnergy = energy * n > res.energy ? energy * n - res.energy : 0n
  // 带宽不够时整笔按字节烧 TRX（不会只烧差额）
  const burnBytes = bytes * n > res.bandwidth ? bytes * n : 0n
  fee += (burnEnergy * params.energyFee + burnBytes * params.bandwidthFee) / n
  // fee_limit：能量全部烧 TRX 时的上限再留五成余量，最少 5 TRX，最多 300 TRX
  const feeLimit = clamp((energy * params.energyFee * 3n) / 2n, 5n * SUN, 300n * SUN)
  return { gasLimit: energy, price: params.energyFee, fee, feeData: { feeLimit, energy, bandwidth: bytes, newAccount: asset.native && fee >= params.newAccountFee } }
}

const clamp = (v, lo, hi) => (v < lo ? lo : v > hi ? hi : v)

/* ---------- 构造 / 签名 / 广播 ---------- */

/** 校验节点返回的交易体：txID 必须等于 raw_data_hex 的 sha256，且合约参数与我们的请求一致 */
function checkTransaction(tx, expect) {
  if (!tx?.txID || !tx.raw_data_hex) throw new Error('节点没有返回交易体')
  if (sha256('0x' + tx.raw_data_hex).slice(2) !== tx.txID) throw new Error('节点返回的交易体与 txID 不一致')
  const value = tx.raw_data?.contract?.[0]?.parameter?.value ?? {}
  for (const [k, v] of Object.entries(expect)) {
    if (String(value[k] ?? '').toLowerCase() !== String(v).toLowerCase()) throw new Error(`节点返回的交易体字段 ${k} 与请求不一致`)
  }
}

function signTransaction(tx, privateKey) {
  const sig = new SigningKey(privateKey).sign('0x' + tx.txID)
  const signature = sig.r.slice(2) + sig.s.slice(2) + (sig.yParity ? '01' : '00')
  return { ...tx, signature: [signature] }
}

async function broadcast(network, signed) {
  const r = await post(network, 'wallet/broadcasttransaction', signed)
  if (r?.result !== true) throw new Error(`${r?.code ?? '广播失败'}${r?.message ? `：${hexMessage(r.message)}` : ''}`)
  return r.txid ?? signed.txID
}

/** 构造一笔未签名的 TRX 或 TRC-20 转账 */
async function buildTransfer({ network, from, to, asset, amount, feeLimit }) {
  const owner = toHex41(from)
  if (asset.native) {
    const tx = await post(network, 'wallet/createtransaction', { owner_address: owner, to_address: toHex41(to), amount: Number(amount) })
    checkTransaction(tx, { owner_address: owner, to_address: toHex41(to), amount: Number(amount) })
    return tx
  }
  const data = iface.encodeFunctionData('transfer', [toHex20(to), amount])
  const r = await post(network, 'wallet/triggersmartcontract', {
    owner_address: owner,
    contract_address: toHex41(asset.address),
    function_selector: 'transfer(address,uint256)',
    parameter: data.slice(10),
    fee_limit: Number(feeLimit ?? 100n * SUN),
    call_value: 0,
  })
  if (r?.result?.result !== true) throw new Error(hexMessage(r?.result?.message) || '构造交易失败')
  checkTransaction(r.transaction, { owner_address: owner, contract_address: toHex41(asset.address), data: data.slice(2) })
  return r.transaction
}

/**
 * 等待交易上链：返回与 EVM 回执同形的对象 { status, blockNumber, gasUsed, gasPrice, fee }
 * 执行失败时像 ethers 一样抛错并带上 receipt；过期仍查不到则抛「已过期」
 */
async function waitReceipt(network, txID, expiresAt) {
  while (true) {
    const info = await post(network, 'wallet/gettransactioninfobyid', { value: txID })
    if (info?.id) return toReceipt(info)
    if (Date.now() > expiresAt + EXPIRE_GRACE_MS) throw new Error('交易已过期，未被打包')
    await sleep(POLL_MS)
  }
}

export function toReceipt(info) {
  const result = info.receipt?.result
  const ok = !result || result === 'SUCCESS'
  const receipt = {
    status: ok ? 1 : 0,
    blockNumber: Number(info.blockNumber ?? 0),
    gasUsed: BigInt(info.receipt?.energy_usage_total ?? 0),
    gasPrice: 0n,
    fee: BigInt(info.fee ?? 0),
    tronResult: result ?? 'SUCCESS',
  }
  if (!ok) {
    const detail = hexMessage(info.resMessage)
    throw Object.assign(new Error(`交易执行失败：${result}${detail ? `（${detail}）` : ''}`), { receipt })
  }
  return receipt
}

/** 待确认记录按 id 查一次：没上链返回 null */
export async function getTxInfo(network, txID) {
  const info = await post(network, 'wallet/gettransactioninfobyid', { value: txID })
  if (!info?.id) return null
  try {
    return toReceipt(info)
  } catch (e) {
    return e.receipt
  }
}

/** 广播一笔转账，返回 { hash, nonce: null, expiresAt, wait() }，与 ethers 的 TransactionResponse 用法一致 */
export async function sendTransfer({ network, privateKey, to, asset, amount, feeData }) {
  const from = new SigningKey(privateKey)
  const fromAddress = computeAddress(from)
  const tx = await buildTransfer({ network, from: fromAddress, to, asset, amount, feeLimit: feeData?.feeLimit })
  const expiresAt = Number(tx.raw_data?.expiration ?? Date.now() + 60_000)
  const hash = await broadcast(network, signTransaction(tx, privateKey))
  return { hash, nonce: null, expiresAt, wait: () => waitReceipt(network, hash, expiresAt) }
}

/** 私钥对应的地址：keccak(公钥) 后 20 字节，与 EVM 地址相同 */
function computeAddress(signingKey) {
  return getAddress(ethersComputeAddress(signingKey.publicKey))
}

/** 等待交易上链；语义同 chain.js 的 waitTx */
async function waitTx(tx, onSettled) {
  try {
    const receipt = await tx.wait()
    onSettled?.(receipt, null)
    return receipt
  } catch (e) {
    onSettled?.(e.receipt ?? null, e)
    throw e
  }
}

/* ---------- 批量任务（语义与 chain.js 同名函数一致） ---------- */

const fmt = (v, d) => formatUnits(v, d)

/** 一笔转账的完整流程：估算 → 广播 → 记录 → 等待；amount 为 bigint 或 'all' */
async function transferOne({ network, privateKey, from, to, asset, amount, onLog, onSent, onSettled }) {
  const log = (type, text) => onLog?.({ type, text })
  const all = amount === 'all'
  let value = amount
  if (asset.native) {
    const balance = await fetchNativeBalance(network, from)
    if (all && balance === 0n) {
      log('info', `${asset.symbol} 余额为 0，跳过`)
      return { skipped: true }
    }
    const est = await estimateTransfer({ network, from, to, asset, amount: all ? 1n : amount })
    if (all) {
      value = balance - est.fee
      if (value <= 0n) {
        log('info', `${asset.symbol} 余额不足以支付手续费，跳过`)
        return { skipped: true }
      }
    } else if (value + est.fee > balance) {
      throw new Error(`${asset.symbol} 余额 ${fmt(balance, TRX_DECIMALS)} 不足以支付 ${fmt(value, TRX_DECIMALS)} 及手续费`)
    }
  } else {
    const balance = await fetchTokenBalance(network, asset.address, from)
    if (all) {
      if (balance === 0n) {
        log('info', `${asset.symbol} 余额为 0，跳过`)
        return { skipped: true }
      }
      value = balance
    } else if (value > balance) {
      throw new Error(`${asset.symbol} 余额 ${fmt(balance, asset.decimals)} 不足`)
    }
  }
  const est = await estimateTransfer({ network, from, to, asset, amount: value })
  const tx = await sendTransfer({ network, privateKey, to, asset, amount: value, feeData: est.feeData })
  log('info', `${fmt(value, asset.decimals)} ${asset.symbol} 已广播 ${tx.hash}`)
  const id = onSent?.({ hash: tx.hash, nonce: null, expiresAt: tx.expiresAt, to, asset, amount: value })
  await waitTx(tx, (receipt, error) => onSettled?.(id, receipt, error))
  log('success', `${fmt(value, asset.decimals)} ${asset.symbol} 转出完成`)
  return { success: true }
}

export async function collectFromWallet({ network, privateKey, to, asset, amount, onLog, onSent, onSettled }) {
  const from = computeAddress(new SigningKey(privateKey))
  try {
    return await transferOne({ network, privateKey, from, to, asset, amount, onLog, onSent, onSettled })
  } catch (e) {
    onLog?.({ type: 'error', text: `${asset.symbol} 转出失败：${errorText(e)}` })
    return { failed: true }
  }
}

export async function drainWallet({ network, privateKey, to, tokens, includeNative, onLog, onSent, onSettled }) {
  const from = computeAddress(new SigningKey(privateKey))
  const result = { success: 0, failed: 0 }
  const assets = [...tokens, ...(includeNative ? [{ native: true, symbol: network.symbol, decimals: TRX_DECIMALS }] : [])]
  for (const asset of assets) {
    try {
      const r = await transferOne({ network, privateKey, from, to, asset, amount: 'all', onLog, onSent, onSettled })
      if (r.success) result.success++
    } catch (e) {
      result.failed++
      onLog?.({ type: 'error', text: `${asset.symbol} 转出失败：${errorText(e)}` })
    }
  }
  return result
}

/** Tron 没有 nonce，各笔互不依赖：依次构造并广播，最后统一等回执 */
export async function batchTransfer({ network, privateKey, asset, items, onUpdate, onSent, onSettled }) {
  const from = computeAddress(new SigningKey(privateKey))
  const result = { success: 0, failed: 0 }
  const waits = []
  for (let i = 0; i < items.length; i++) {
    const { to, amount } = items[i]
    onUpdate?.(i, { status: 'running', text: '估算资源…' })
    try {
      const est = await estimateTransfer({ network, from, to, asset, amount })
      const tx = await sendTransfer({ network, privateKey, to, asset, amount, feeData: est.feeData })
      onUpdate?.(i, { status: 'running', text: `已广播 ${tx.hash}` })
      const id = onSent?.(i, { hash: tx.hash, nonce: null, expiresAt: tx.expiresAt, to, asset, amount })
      waits.push(
        waitTx(tx, (receipt, error) => onSettled?.(id, receipt, error))
          .then(() => {
            result.success++
            onUpdate?.(i, { status: 'done', text: `已确认 ${tx.hash}` })
          })
          .catch((e) => {
            result.failed++
            onUpdate?.(i, { status: 'failed', text: `失败：${errorText(e)}` })
          }),
      )
    } catch (e) {
      result.failed++
      onUpdate?.(i, { status: 'failed', text: `广播失败：${errorText(e)}` })
    }
  }
  await Promise.all(waits)
  return result
}
