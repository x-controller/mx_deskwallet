import { JsonRpcProvider, Wallet, Contract, FetchRequest, formatUnits } from 'ethers'
import { isTauri } from './storage'
import { errorText } from './async'
import * as tron from './tron'
import { isTron, toTronAddress } from './tron'

export { isTron, toTronAddress }

/** 原生币小数位：EVM 18，Tron 6（存在网络配置的 decimals 里） */
export const nativeDecimals = (network) => network?.decimals ?? 18

/** 钱包地址按当前网络的写法展示：Tron 显示 T 开头的 base58，其余显示 0x 十六进制 */
export const chainAddress = (network, hexAddress) => (isTron(network) ? toTronAddress(hexAddress) : hexAddress)

/** 接收地址输入框的占位符 */
export const addressPlaceholder = (network) => (isTron(network) ? 'T...' : '0x...')

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
  'function allowance(address owner, address spender) view returns (uint256)',
  'function approve(address spender, uint256 amount) returns (bool)',
]

/**
 * Tauri 环境下让 ethers 的 HTTP 请求走 plugin-http，绕开 webview 的 CORS 限制
 */
export function installRpcTransport() {
  if (!isTauri) return
  FetchRequest.registerGetUrl(async (req, signal) => {
    const { fetch: tauriFetch } = await import('@tauri-apps/plugin-http')
    const controller = new AbortController()
    signal?.addListener?.(() => controller.abort())
    const res = await tauriFetch(req.url, {
      method: req.method,
      headers: req.headers,
      body: req.body ?? undefined,
      signal: controller.signal,
    })
    const headers = {}
    res.headers.forEach((v, k) => {
      headers[k.toLowerCase()] = v
    })
    return {
      statusCode: res.status,
      statusMessage: res.statusText,
      headers,
      body: new Uint8Array(await res.arrayBuffer()),
    }
  })
}

const providerCache = new Map()

export function getProvider(network) {
  const cacheKey = `${network.rpcUrl}|${network.chainId}`
  if (!providerCache.has(cacheKey)) {
    const provider = new JsonRpcProvider(network.rpcUrl, Number(network.chainId), {
      staticNetwork: true,
      batchMaxCount: 10,
      polling: true,
      pollingInterval: 2000,
    })
    providerCache.set(cacheKey, provider)
  }
  return providerCache.get(cacheKey)
}

/** 探测 RPC 的 chainId（不走缓存，用于配置时校验） */
export async function detectChainId(rpcUrl) {
  const provider = new JsonRpcProvider(rpcUrl, undefined, { batchMaxCount: 1 })
  try {
    const net = await provider.getNetwork()
    return Number(net.chainId)
  } finally {
    provider.destroy()
  }
}

export const fetchNativeBalance = (network, address) => (isTron(network) ? tron.fetchNativeBalance(network, address) : getProvider(network).getBalance(address))

export function fetchTokenBalance(network, tokenAddress, address) {
  if (isTron(network)) return tron.fetchTokenBalance(network, tokenAddress, address)
  return new Contract(tokenAddress, ERC20_ABI, getProvider(network)).balanceOf(address)
}

export async function fetchTokenMeta(network, tokenAddress) {
  if (isTron(network)) return tron.fetchTokenMeta(network, tokenAddress)
  const c = new Contract(tokenAddress, ERC20_ABI, getProvider(network))
  const [symbol, decimals] = await Promise.all([c.symbol(), c.decimals()])
  return { symbol, decimals: Number(decimals) }
}

export { runPool, withRetry, errorText } from './async'

/** 按 RPC 返回的费率构造交易费用字段：支持 EIP-1559 走 type 2，否则退回 legacy gasPrice */
function feeOverrides(feeData, gasLimit) {
  return feeData.maxFeePerGas
    ? { gasLimit, maxFeePerGas: feeData.maxFeePerGas, maxPriorityFeePerGas: feeData.maxPriorityFeePerGas, type: 2 }
    : { gasLimit, gasPrice: feeData.gasPrice, type: 0 }
}

/** 原生币转账的 gas 上限：按 1 wei 估算（避免余额不足导致估算失败），失败时按普通转账 21000 */
async function estimateNativeGas(provider, from, to) {
  try {
    return await provider.estimateGas({ from, to, value: 1n })
  } catch {
    return 21000n
  }
}

/**
 * 估算一笔转账的费用
 * asset：原生币 { native: true } 或 Token { address }
 * 返回 { gasLimit, price: 单位 gas 最高价, fee: 最高总费用, feeData }
 */
export async function estimateTransfer({ network, from, to, asset, amount }) {
  if (isTron(network)) return tron.estimateTransfer({ network, from, to, asset, amount })
  const provider = getProvider(network)
  const feeData = await provider.getFeeData()
  const price = feeData.maxFeePerGas ?? feeData.gasPrice
  const gasLimit = asset.native
    ? await estimateNativeGas(provider, from, to)
    : await new Contract(asset.address, ERC20_ABI, provider).transfer.estimateGas(to, amount, { from })
  return { gasLimit, price, fee: gasLimit * price, feeData }
}

/** 广播一笔转账，返回 ethers 的 TransactionResponse（含 hash / nonce / wait） */
export async function sendTransfer({ network, privateKey, to, asset, amount, gasLimit, feeData }) {
  if (isTron(network)) return tron.sendTransfer({ network, privateKey, to, asset, amount, feeData })
  const wallet = new Wallet(privateKey, getProvider(network))
  const overrides = feeOverrides(feeData, gasLimit)
  if (asset.native) return wallet.sendTransaction({ to, value: amount, ...overrides })
  return new Contract(asset.address, ERC20_ABI, wallet).transfer(to, amount, overrides)
}

/**
 * 等待交易上链。无论成功还是回滚都把回执交给 onSettled(receipt, error)，
 * 回滚 / 等待出错时继续抛出，由调用方决定如何提示
 */
export async function waitTx(tx, onSettled) {
  try {
    const receipt = await tx.wait()
    onSettled?.(receipt, null)
    return receipt
  } catch (e) {
    onSettled?.(e.receipt ?? null, e)
    throw e
  }
}

/**
 * 清空单个钱包：先逐个转出勾选的 Token，再把原生币扣除 gas 后全部转出
 * onLog({ type: 'info' | 'success' | 'error', text })
 * onSent({ hash, nonce, to, asset, amount }) 每笔广播后调用，返回值作为记录 id 传给 onSettled(id, receipt, error)
 * 返回 { success: 成功笔数, failed: 失败笔数 }
 */
export async function drainWallet(args) {
  if (isTron(args.network)) return tron.drainWallet(args)
  return drainEvmWallet(args)
}

async function drainEvmWallet({ network, privateKey, to, tokens, includeNative, onLog, onSent, onSettled }) {
  const provider = getProvider(network)
  const wallet = new Wallet(privateKey, provider)
  const log = (type, text) => onLog?.({ type, text })
  const result = { success: 0, failed: 0 }

  async function broadcastAndWait(tx, asset, amount) {
    log('info', `${asset.symbol} 已广播 ${tx.hash}`)
    const id = onSent?.({ hash: tx.hash, nonce: tx.nonce, to, asset, amount })
    await waitTx(tx, (receipt, error) => onSettled?.(id, receipt, error))
    log('success', `${asset.symbol} 转出完成`)
    result.success++
  }

  for (const token of tokens) {
    try {
      const c = new Contract(token.address, ERC20_ABI, wallet)
      const bal = await c.balanceOf(wallet.address)
      if (bal === 0n) {
        log('info', `${token.symbol} 余额为 0，跳过`)
        continue
      }
      await broadcastAndWait(await c.transfer(to, bal), token, bal)
    } catch (e) {
      result.failed++
      log('error', `${token.symbol} 转出失败：${errorText(e)}`)
    }
  }

  if (includeNative) {
    const native = { native: true, symbol: network.symbol, decimals: nativeDecimals(network) }
    try {
      const balance = await provider.getBalance(wallet.address)
      if (balance === 0n) {
        log('info', `${network.symbol} 余额为 0，跳过`)
        return result
      }
      const feeData = await provider.getFeeData()
      const gasLimit = await estimateNativeGas(provider, wallet.address, to)
      const value = balance - gasLimit * (feeData.maxFeePerGas ?? feeData.gasPrice)
      if (value <= 0n) {
        log('info', `${network.symbol} 余额不足以支付 gas，跳过`)
        return result
      }
      const tx = await wallet.sendTransaction({ to, value, ...feeOverrides(feeData, gasLimit) })
      await broadcastAndWait(tx, native, value)
    } catch (e) {
      result.failed++
      log('error', `${network.symbol} 转出失败：${errorText(e)}`)
    }
  }
  return result
}

/**
 * 聚合转账的单钱包步骤：把一种资产转到目标地址。
 * amount 为 bigint（固定数量）或 'all'（全部余额；原生币扣除 gas）
 * 回调语义同 drainWallet；返回 { success | failed | skipped: true }
 */
export async function collectFromWallet(args) {
  if (isTron(args.network)) return tron.collectFromWallet(args)
  return collectFromEvmWallet(args)
}

async function collectFromEvmWallet({ network, privateKey, to, asset, amount, onLog, onSent, onSettled }) {
  const provider = getProvider(network)
  const wallet = new Wallet(privateKey, provider)
  const log = (type, text) => onLog?.({ type, text })
  const all = amount === 'all'
  try {
    let tx
    let value
    if (asset.native) {
      const [balance, feeData, gasLimit] = await Promise.all([
        provider.getBalance(wallet.address),
        provider.getFeeData(),
        estimateNativeGas(provider, wallet.address, to),
      ])
      const fee = gasLimit * (feeData.maxFeePerGas ?? feeData.gasPrice)
      if (all) {
        if (balance === 0n) {
          log('info', `${asset.symbol} 余额为 0，跳过`)
          return { skipped: true }
        }
        value = balance - fee
        if (value <= 0n) {
          log('info', `${asset.symbol} 余额不足以支付 gas，跳过`)
          return { skipped: true }
        }
      } else {
        value = amount
        if (value + fee > balance) throw new Error(`${asset.symbol} 余额 ${formatUnits(balance, 18)} 不足以支付 ${formatUnits(value, 18)} 及手续费`)
      }
      tx = await wallet.sendTransaction({ to, value, ...feeOverrides(feeData, gasLimit) })
    } else {
      const c = new Contract(asset.address, ERC20_ABI, wallet)
      const balance = await c.balanceOf(wallet.address)
      if (all) {
        if (balance === 0n) {
          log('info', `${asset.symbol} 余额为 0，跳过`)
          return { skipped: true }
        }
        value = balance
      } else {
        value = amount
        if (value > balance) throw new Error(`${asset.symbol} 余额 ${formatUnits(balance, asset.decimals)} 不足`)
      }
      tx = await c.transfer(to, value)
    }
    log('info', `${formatUnits(value, asset.decimals)} ${asset.symbol} 已广播 ${tx.hash}`)
    const id = onSent?.({ hash: tx.hash, nonce: tx.nonce, to, asset, amount: value })
    await waitTx(tx, (receipt, error) => onSettled?.(id, receipt, error))
    log('success', `${formatUnits(value, asset.decimals)} ${asset.symbol} 转出完成`)
    return { success: true }
  } catch (e) {
    log('error', `${asset.symbol} 转出失败：${errorText(e)}`)
    return { failed: true }
  }
}

/**
 * 批量转账：从一个钱包依次向多个地址转同一种资产。
 * 用本地递增的 nonce 连续广播、不等上一笔确认，全部广播后统一等回执；某笔广播失败不占用 nonce，下一笔继续。
 * items：[{ to, amount: bigint }]
 * onUpdate(index, { status: 'running' | 'done' | 'failed', text })
 * onSent(index, { hash, nonce, to, asset, amount }) 返回记录 id，传给 onSettled(id, receipt, error)
 * 返回 { success, failed }
 */
export async function batchTransfer(args) {
  if (isTron(args.network)) return tron.batchTransfer(args)
  return batchEvmTransfer(args)
}

async function batchEvmTransfer({ network, privateKey, asset, items, onUpdate, onSent, onSettled }) {
  const provider = getProvider(network)
  const wallet = new Wallet(privateKey, provider)
  const contract = asset.native ? null : new Contract(asset.address, ERC20_ABI, wallet)
  const result = { success: 0, failed: 0 }
  const feeData = await provider.getFeeData()
  let nonce = await provider.getTransactionCount(wallet.address, 'pending')
  const waits = []

  for (let i = 0; i < items.length; i++) {
    const { to, amount } = items[i]
    onUpdate?.(i, { status: 'running', text: '估算 gas…' })
    try {
      const gasLimit = asset.native ? await estimateNativeGas(provider, wallet.address, to) : await contract.transfer.estimateGas(to, amount)
      const overrides = { ...feeOverrides(feeData, gasLimit), nonce }
      const tx = asset.native ? await wallet.sendTransaction({ to, value: amount, ...overrides }) : await contract.transfer(to, amount, overrides)
      nonce++
      onUpdate?.(i, { status: 'running', text: `已广播 ${tx.hash}` })
      const id = onSent?.(i, { hash: tx.hash, nonce: tx.nonce, to, asset, amount })
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
