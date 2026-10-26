import { Contract, Wallet, MaxUint256, solidityPacked } from 'ethers'
import { getProvider, ERC20_ABI, waitTx, errorText } from './chain'

/**
 * DEX 兑换：统一「路线」模型 { path: 地址数组, fees: V3 各跳手续费（万分比），V2 为空 }
 * V2：Uniswap V2 Router02 及分叉（PancakeSwap V2 / QuickSwap …）
 * V3：Uniswap V3 SwapRouter02 + QuoterV2，PancakeSwap V3 SmartRouter 同一套接口
 */
export const DEX_VERSIONS = [
  { value: 'v2', label: 'V2（Uniswap V2 / PancakeSwap V2 / QuickSwap…）' },
  { value: 'v3', label: 'V3（Uniswap V3 / PancakeSwap V3）' },
]

export const FEE_TIERS_UNISWAP = [100, 500, 3000, 10000]
export const FEE_TIERS_PANCAKE = [100, 500, 2500, 10000]

/** 万分比手续费 → 百分数文案：3000 → 0.3% */
export const feeTierLabel = (fee) => `${Number(fee) / 10000}%`

const V2_ROUTER_ABI = [
  'function WETH() view returns (address)',
  'function getAmountsOut(uint256 amountIn, address[] path) view returns (uint256[] amounts)',
  'function swapExactTokensForTokensSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
  'function swapExactETHForTokensSupportingFeeOnTransferTokens(uint256 amountOutMin, address[] path, address to, uint256 deadline) payable',
  'function swapExactTokensForETHSupportingFeeOnTransferTokens(uint256 amountIn, uint256 amountOutMin, address[] path, address to, uint256 deadline)',
]

const V3_ROUTER_ABI = [
  'function WETH9() view returns (address)',
  'function exactInputSingle((address tokenIn, address tokenOut, uint24 fee, address recipient, uint256 amountIn, uint256 amountOutMinimum, uint160 sqrtPriceLimitX96) params) payable returns (uint256 amountOut)',
  'function exactInput((bytes path, address recipient, uint256 amountIn, uint256 amountOutMinimum) params) payable returns (uint256 amountOut)',
  'function unwrapWETH9(uint256 amountMinimum, address recipient) payable',
  'function multicall(uint256 deadline, bytes[] data) payable returns (bytes[] results)',
]

const V3_QUOTER_ABI = [
  'function WETH9() view returns (address)',
  'function quoteExactInputSingle((address tokenIn, address tokenOut, uint256 amountIn, uint24 fee, uint160 sqrtPriceLimitX96) params) returns (uint256 amountOut, uint160 sqrtPriceX96After, uint32 initializedTicksCrossed, uint256 gasEstimate)',
  'function quoteExactInput(bytes path, uint256 amountIn) returns (uint256 amountOut, uint160[] sqrtPriceX96AfterList, uint32[] initializedTicksCrossedList, uint256 gasEstimate)',
]

/** SwapRouter02 约定的特殊收款人：先把产出留在路由里，随后 unwrapWETH9 再付给用户 */
const ADDRESS_THIS = '0x0000000000000000000000000000000000000002'
/** 兑换时给原生币「全部」预留的 gas 上限 */
const SWAP_GAS_RESERVE = 300000n
/** V3 经包装币中转时不尝试的档位（0.01% 只用于稳定币对） */
const MIN_HOP_FEE = 500

const isV3 = (dex) => dex.version === 'v3'
const sameAddress = (a, b) => a.toLowerCase() === b.toLowerCase()
/** 资产在兑换路径里的地址：原生币用交易所的包装币 */
const pathAddress = (asset, dex) => (asset.native ? dex.wrappedNative : asset.address)

/** 读取路由声明的包装币（配置交易所时自动填充）；V3 同时校验 Quoter 一致 */
export async function fetchDexWrapped(network, dex) {
  const provider = getProvider(network)
  if (!isV3(dex)) return new Contract(dex.router, V2_ROUTER_ABI, provider).WETH()
  const [fromRouter, fromQuoter] = await Promise.all([
    new Contract(dex.router, V3_ROUTER_ABI, provider).WETH9(),
    new Contract(dex.quoter, V3_QUOTER_ABI, provider).WETH9(),
  ])
  if (!sameAddress(fromRouter, fromQuoter)) throw new Error('Router 与 Quoter 的包装币不一致')
  return fromRouter
}

function candidateRoutes(dex, from, to) {
  const direct = [from, to]
  const viaWrapped = !sameAddress(from, dex.wrappedNative) && !sameAddress(to, dex.wrappedNative) ? [from, dex.wrappedNative, to] : null
  if (!isV3(dex)) return [direct, viaWrapped].filter(Boolean).map((path) => ({ path, fees: [] }))
  const tiers = dex.feeTiers?.length ? dex.feeTiers : FEE_TIERS_UNISWAP
  const routes = tiers.map((fee) => ({ path: direct, fees: [fee] }))
  if (viaWrapped) {
    const hopTiers = tiers.filter((f) => f >= MIN_HOP_FEE)
    hopTiers.forEach((f1) => hopTiers.forEach((f2) => routes.push({ path: viaWrapped, fees: [f1, f2] })))
  }
  return routes
}

/** V3 多跳路径编码：address(20) + fee(3) + address(20) … */
function encodeV3Path(path, fees) {
  const types = []
  const values = []
  path.forEach((addr, i) => {
    types.push('address')
    values.push(addr)
    if (i < fees.length) {
      types.push('uint24')
      values.push(fees[i])
    }
  })
  return solidityPacked(types, values)
}

async function quoteRoute(network, dex, route, amountIn) {
  const provider = getProvider(network)
  if (!isV3(dex)) {
    const amounts = await new Contract(dex.router, V2_ROUTER_ABI, provider).getAmountsOut(amountIn, route.path)
    return amounts[amounts.length - 1]
  }
  const quoter = new Contract(dex.quoter, V3_QUOTER_ABI, provider)
  if (route.path.length === 2) {
    const r = await quoter.quoteExactInputSingle.staticCall({ tokenIn: route.path[0], tokenOut: route.path[1], amountIn, fee: route.fees[0], sqrtPriceLimitX96: 0n })
    return r.amountOut
  }
  const r = await quoter.quoteExactInput.staticCall(encodeV3Path(route.path, route.fees), amountIn)
  return r.amountOut
}

/**
 * 报价：在所有候选路线（V2 直连 / 中转，V3 各手续费档位 × 直连 / 中转）里取输出最多的
 * 返回 { path, fees, amountOut, priceImpact: 百分比数字 | null }
 */
export async function quoteSwap({ network, dex, fromAsset, toAsset, amountIn }) {
  const from = pathAddress(fromAsset, dex)
  const to = pathAddress(toAsset, dex)
  if (sameAddress(from, to)) {
    throw new Error(fromAsset.native !== toAsset.native ? '原生币与包装币之间是 wrap / unwrap，不走兑换' : '卖出与买入资产相同')
  }
  const quotes = await Promise.all(
    candidateRoutes(dex, from, to).map(async (route) => {
      try {
        return { ...route, amountOut: await quoteRoute(network, dex, route, amountIn) }
      } catch {
        return null
      }
    }),
  )
  const best = quotes.filter((q) => q && q.amountOut > 0n).sort((a, b) => (a.amountOut > b.amountOut ? -1 : 1))[0]
  if (!best) throw new Error('该交易所没有可用的流动性路径')

  // 价格影响：用万分之一数量探测现价，对比实际成交均价
  let priceImpact = null
  const probe = amountIn / 10000n
  if (probe > 0n) {
    try {
      const spotOut = (await quoteRoute(network, dex, best, probe)) * 10000n
      if (spotOut > 0n) priceImpact = Math.max(0, Number(((spotOut - best.amountOut) * 10000n) / spotOut) / 100)
    } catch {
      /* 探测失败只是不显示价格影响 */
    }
  }
  return { path: best.path, fees: best.fees, amountOut: best.amountOut, priceImpact }
}

/** 按滑点（万分比）算最少到手 */
export const applySlippage = (amountOut, slippageBps) => (amountOut * (10000n - BigInt(slippageBps))) / 10000n

function sendSwap({ wallet, dex, fromAsset, toAsset, amount, amountOutMin, route, deadline }) {
  if (!isV3(dex)) {
    const router = new Contract(dex.router, V2_ROUTER_ABI, wallet)
    if (fromAsset.native) return router.swapExactETHForTokensSupportingFeeOnTransferTokens(amountOutMin, route.path, wallet.address, deadline, { value: amount })
    if (toAsset.native) return router.swapExactTokensForETHSupportingFeeOnTransferTokens(amount, amountOutMin, route.path, wallet.address, deadline)
    return router.swapExactTokensForTokensSupportingFeeOnTransferTokens(amount, amountOutMin, route.path, wallet.address, deadline)
  }
  // V3：原生币卖出靠 msg.value 自动 wrap；买入原生币先留在路由再 unwrapWETH9，两步打进一个 multicall
  const router = new Contract(dex.router, V3_ROUTER_ABI, wallet)
  const recipient = toAsset.native ? ADDRESS_THIS : wallet.address
  const swapData =
    route.path.length === 2
      ? router.interface.encodeFunctionData('exactInputSingle', [
          { tokenIn: route.path[0], tokenOut: route.path[1], fee: route.fees[0], recipient, amountIn: amount, amountOutMinimum: amountOutMin, sqrtPriceLimitX96: 0n },
        ])
      : router.interface.encodeFunctionData('exactInput', [{ path: encodeV3Path(route.path, route.fees), recipient, amountIn: amount, amountOutMinimum: amountOutMin }])
  const calls = [swapData]
  if (toAsset.native) calls.push(router.interface.encodeFunctionData('unwrapWETH9', [amountOutMin, wallet.address]))
  return router.multicall(deadline, calls, { value: fromAsset.native ? amount : 0n })
}

/**
 * 单钱包兑换全流程：查余额 → 报价 → 按需 approve → swap
 * amountIn 为 'all' 时卖出全部余额（原生币预留 gas）
 * onLog / onSent / onSettled 语义同 drainWallet
 * 返回 { success: 成功笔数, failed: 失败笔数 }
 */
export async function swapWallet({ network, dex, privateKey, fromAsset, toAsset, amountIn, slippageBps, approveUnlimited, deadlineMinutes = 20, onLog, onSent, onSettled }) {
  const provider = getProvider(network)
  const wallet = new Wallet(privateKey, provider)
  const log = (type, text) => onLog?.({ type, text })
  const result = { success: 0, failed: 0 }

  async function broadcastAndWait(tx, record, doneText) {
    log('info', `已广播 ${tx.hash}`)
    const id = onSent?.({ hash: tx.hash, nonce: tx.nonce, to: tx.to, ...record })
    await waitTx(tx, (receipt, error) => onSettled?.(id, receipt, error))
    log('success', doneText)
    result.success++
  }

  try {
    let amount = amountIn
    if (amountIn === 'all') {
      if (fromAsset.native) {
        const balance = await provider.getBalance(wallet.address)
        const feeData = await provider.getFeeData()
        amount = balance - SWAP_GAS_RESERVE * (feeData.maxFeePerGas ?? feeData.gasPrice)
      } else {
        amount = await new Contract(fromAsset.address, ERC20_ABI, provider).balanceOf(wallet.address)
      }
      if (amount <= 0n) {
        log('info', `${fromAsset.symbol} 余额为 0 或不足以支付 gas，跳过`)
        return result
      }
    }

    const quote = await quoteSwap({ network, dex, fromAsset, toAsset, amountIn: amount })
    const amountOutMin = applySlippage(quote.amountOut, slippageBps)
    const deadline = BigInt(Math.floor(Date.now() / 1000) + deadlineMinutes * 60)

    if (!fromAsset.native) {
      const token = new Contract(fromAsset.address, ERC20_ABI, wallet)
      const allowance = await token.allowance(wallet.address, dex.router)
      if (allowance < amount) {
        const approveAmount = approveUnlimited ? MaxUint256 : amount
        log('info', `授权 ${dex.name} 使用 ${fromAsset.symbol}`)
        const tx = await token.approve(dex.router, approveAmount)
        await broadcastAndWait(tx, { kind: 'approve', asset: fromAsset, amount: approveAmount }, `${fromAsset.symbol} 授权完成`)
      }
    }

    const tx = await sendSwap({ wallet, dex, fromAsset, toAsset, amount, amountOutMin, route: quote, deadline })
    await broadcastAndWait(
      tx,
      { kind: 'swap', asset: fromAsset, amount, toAsset, amountOut: quote.amountOut },
      `兑换完成：${fromAsset.symbol} → ${toAsset.symbol}`,
    )
  } catch (e) {
    result.failed++
    log('error', `兑换失败：${errorText(e)}`)
  }
  return result
}
