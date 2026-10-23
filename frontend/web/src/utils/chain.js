import { JsonRpcProvider, Wallet, Contract, FetchRequest } from 'ethers'
import { isTauri } from './storage'

export const ERC20_ABI = [
  'function balanceOf(address) view returns (uint256)',
  'function transfer(address to, uint256 amount) returns (bool)',
  'function decimals() view returns (uint8)',
  'function symbol() view returns (string)',
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

export const fetchNativeBalance = (network, address) => getProvider(network).getBalance(address)

export function fetchTokenBalance(network, tokenAddress, address) {
  return new Contract(tokenAddress, ERC20_ABI, getProvider(network)).balanceOf(address)
}

export async function fetchTokenMeta(network, tokenAddress) {
  const c = new Contract(tokenAddress, ERC20_ABI, getProvider(network))
  const [symbol, decimals] = await Promise.all([c.symbol(), c.decimals()])
  return { symbol, decimals: Number(decimals) }
}

/** 并发受限地批量执行任务 */
export async function runPool(items, limit, worker) {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift())
  })
  await Promise.all(runners)
}

function errorText(e) {
  return e?.shortMessage || e?.reason || e?.message || String(e)
}

/**
 * 清空单个钱包：先逐个转出勾选的 Token，再把原生币扣除 gas 后全部转出
 * onLog({ type: 'info' | 'success' | 'error', text })
 * 返回 { success: 成功笔数, failed: 失败笔数 }
 */
export async function drainWallet({ network, privateKey, to, tokens, includeNative, onLog }) {
  const provider = getProvider(network)
  const wallet = new Wallet(privateKey, provider)
  const log = (type, text) => onLog?.({ type, text })
  const result = { success: 0, failed: 0 }

  for (const token of tokens) {
    try {
      const c = new Contract(token.address, ERC20_ABI, wallet)
      const bal = await c.balanceOf(wallet.address)
      if (bal === 0n) {
        log('info', `${token.symbol} 余额为 0，跳过`)
        continue
      }
      const tx = await c.transfer(to, bal)
      log('info', `${token.symbol} 已广播 ${tx.hash}`)
      await tx.wait()
      log('success', `${token.symbol} 转出完成`)
      result.success++
    } catch (e) {
      result.failed++
      log('error', `${token.symbol} 转出失败：${errorText(e)}`)
    }
  }

  if (includeNative) {
    try {
      const balance = await provider.getBalance(wallet.address)
      if (balance === 0n) {
        log('info', `${network.symbol} 余额为 0，跳过`)
        return result
      }
      const fee = await provider.getFeeData()
      let gasLimit = 21000n
      try {
        gasLimit = await provider.estimateGas({ from: wallet.address, to, value: 1n })
      } catch {
        /* 估算失败时按普通转账 21000 处理 */
      }
      const price = fee.maxFeePerGas ?? fee.gasPrice
      const value = balance - gasLimit * price
      if (value <= 0n) {
        log('info', `${network.symbol} 余额不足以支付 gas，跳过`)
        return result
      }
      const req = fee.maxFeePerGas
        ? { to, value, gasLimit, maxFeePerGas: fee.maxFeePerGas, maxPriorityFeePerGas: fee.maxPriorityFeePerGas, type: 2 }
        : { to, value, gasLimit, gasPrice: fee.gasPrice, type: 0 }
      const tx = await wallet.sendTransaction(req)
      log('info', `${network.symbol} 已广播 ${tx.hash}`)
      await tx.wait()
      log('success', `${network.symbol} 转出完成`)
      result.success++
    } catch (e) {
      result.failed++
      log('error', `${network.symbol} 转出失败：${errorText(e)}`)
    }
  }
  return result
}
