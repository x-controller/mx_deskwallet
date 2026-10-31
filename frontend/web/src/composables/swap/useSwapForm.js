import { computed, reactive, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { runPool, errorText } from '@/utils/chain'
import { quoteSwap, applySlippage, swapWallet } from '@/utils/dex'
import { formatAmount } from '@/utils/format'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { NATIVE_KEY, networkAssets } from '@/composables/wallet/useTransferForm'
import { useWalletProgress } from '@/composables/wallet/useDrainTask'

const DEFAULT_SLIPPAGE = '0.5'
export const MAX_SLIPPAGE = 50

/** 兑换弹框：交易所 / 资产对 / 数量 / 滑点、防抖报价、校验、按钱包并发执行。props 需要 modelValue、wallets、network */
export function useSwapForm(props, emit) {
  const walletStore = useWalletStore()
  const txStore = useTxStore()

  const dexId = ref('')
  const fromKey = ref(NATIVE_KEY)
  const toKey = ref('')
  const fromAsset = ref(null)
  const toAsset = ref(null)
  const amount = ref('')
  const allMode = ref(false)
  const slippage = ref(DEFAULT_SLIPPAGE)
  const approveUnlimited = ref(false)
  const errors = ref({})
  const quote = reactive({ loading: false, error: '', amountOut: null, amountOutMin: null, priceImpact: null, path: [], fees: [] })
  const running = ref(false)
  trackBusy(running)
  const finished = ref(false)
  const { progress, logs, resetProgress, pushLog } = useWalletProgress(() => props.wallets)

  const single = computed(() => props.wallets.length === 1)
  const dexes = computed(() => props.network?.dexes ?? [])
  const dex = computed(() => dexes.value.find((d) => d.id === dexId.value) ?? null)
  const dexOptions = computed(() => dexes.value.map((d) => ({ label: `${d.name} · ${(d.version || 'v2').toUpperCase()}`, value: d.id })))
  const locked = computed(() => running.value || finished.value)

  const assets = computed(() => networkAssets(props.network))

  /** 单钱包时各资产余额文案，供下拉选项展示 */
  const balance = computed(() => (single.value && props.network ? walletStore.getBalance(props.network.id, props.wallets[0].address) : null))
  const balanceLoading = computed(() => !!balance.value?.loading)
  const rawBalanceOf = (a) => {
    if (!balance.value || balance.value.loading) return null
    const raw = a.native ? balance.value.raw : balance.value.tokens?.[a.key]
    return raw === undefined ? null : raw
  }
  const balances = computed(() => {
    if (!single.value) return {}
    return Object.fromEntries(assets.value.map((a) => [a.key, rawBalanceOf(a) === null ? '—' : formatAmount(rawBalanceOf(a), a.decimals, 6)]))
  })
  const fromBalance = computed(() => (fromAsset.value && single.value ? rawBalanceOf(fromAsset.value) : null))
  const fromBalanceText = computed(() => (fromBalance.value === null ? '—' : formatAmount(fromBalance.value, fromAsset.value?.decimals ?? 18, 6)))

  /** 路径展示用的地址 → 符号表 */
  const symbols = computed(() => {
    const map = {}
    if (dex.value) map[dex.value.wrappedNative.toLowerCase()] = `W${props.network.symbol}`
    assets.value.forEach((a) => {
      if (a.address) map[a.address.toLowerCase()] = a.symbol
    })
    ;[fromAsset.value, toAsset.value].forEach((a) => {
      if (a?.address) map[a.address.toLowerCase()] = a.symbol
    })
    return map
  })

  const parsedAmount = computed(() => {
    if (!fromAsset.value) return null
    const s = amount.value.trim()
    if (!s) return null
    try {
      return parseUnits(s, fromAsset.value.decimals)
    } catch {
      return null
    }
  })

  const slippageBps = computed(() => {
    const n = Number(slippage.value)
    if (!Number.isFinite(n) || n <= 0 || n > MAX_SLIPPAGE) return null
    return Math.round(n * 100)
  })

  /** 用于报价的数量：全部模式下只有单钱包能确定数量 */
  const quoteAmount = computed(() => {
    if (allMode.value) return single.value ? fromBalance.value : null
    return parsedAmount.value
  })

  const quoteIdleText = computed(() => (allMode.value && !single.value ? '批量按各钱包全部余额兑换，执行时逐钱包报价' : '填写数量后显示报价'))
  const canStart = computed(() => !locked.value && !!dex.value && !!fromAsset.value && !!toAsset.value && props.wallets.length > 0)

  function reset() {
    dexId.value = dexes.value[0]?.id ?? ''
    fromKey.value = NATIVE_KEY
    toKey.value = assets.value.find((a) => !a.native)?.key ?? ''
    fromAsset.value = null
    toAsset.value = null
    amount.value = ''
    allMode.value = false
    slippage.value = DEFAULT_SLIPPAGE
    approveUnlimited.value = false
    errors.value = {}
    Object.assign(quote, { loading: false, error: '', amountOut: null, amountOutMin: null, priceImpact: null, path: [] })
    running.value = false
    finished.value = false
    resetProgress()
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v || !props.network) return
      reset()
      if (single.value) walletStore.refreshBalances(props.network, [props.wallets[0].address])
    },
  )

  let quoteTimer
  let quoteSeq = 0
  async function runQuote() {
    const seq = ++quoteSeq
    const amountIn = quoteAmount.value
    if (!dex.value || !fromAsset.value || !toAsset.value || !amountIn || amountIn <= 0n) {
      Object.assign(quote, { loading: false, error: '', amountOut: null, amountOutMin: null, priceImpact: null, path: [] })
      return
    }
    quote.loading = true
    quote.error = ''
    try {
      const r = await quoteSwap({ network: props.network, dex: dex.value, fromAsset: fromAsset.value, toAsset: toAsset.value, amountIn })
      if (seq !== quoteSeq) return
      const amountOutMin = slippageBps.value === null ? null : applySlippage(r.amountOut, slippageBps.value)
      Object.assign(quote, { loading: false, amountOut: r.amountOut, amountOutMin, priceImpact: r.priceImpact, path: r.path, fees: r.fees ?? [] })
    } catch (e) {
      if (seq !== quoteSeq) return
      Object.assign(quote, { loading: false, error: `报价失败：${errorText(e)}`, amountOut: null, amountOutMin: null, priceImpact: null, path: [] })
    }
  }

  watch([dexId, fromAsset, toAsset, quoteAmount], () => {
    clearTimeout(quoteTimer)
    quoteTimer = setTimeout(runQuote, 500)
  })

  /* 滑点只影响最少到手，本地重算即可，不必重新报价 */
  watch(slippageBps, (bps) => {
    if (quote.amountOut !== null) quote.amountOutMin = bps === null ? null : applySlippage(quote.amountOut, bps)
  })

  function validateForm() {
    const errs = {}
    if (!dex.value) errs.dex = '请选择交易所'
    if (!fromAsset.value) errs.from = '请选择卖出资产'
    if (!toAsset.value) errs.to = '请选择买入资产'
    if (fromAsset.value && toAsset.value) {
      const same = fromAsset.value.native === toAsset.value.native && (fromAsset.value.native || fromAsset.value.address.toLowerCase() === toAsset.value.address.toLowerCase())
      if (same) errs.to = '买入资产不能与卖出资产相同'
    }
    if (!allMode.value) {
      if (!amount.value.trim()) errs.amount = '请输入数量，或勾选全部余额'
      else if (parsedAmount.value === null) errs.amount = `数量格式不正确（最多 ${fromAsset.value?.decimals ?? 18} 位小数）`
      else if (parsedAmount.value <= 0n) errs.amount = '数量须大于 0'
      else if (single.value && fromBalance.value !== null && parsedAmount.value > fromBalance.value) errs.amount = `超过可用余额 ${formatAmount(fromBalance.value, fromAsset.value.decimals, 6)}`
    }
    if (slippageBps.value === null) errs.slippage = `滑点须在 0 ~ ${MAX_SLIPPAGE} 之间`
    return errs
  }

  async function start() {
    errors.value = validateForm()
    if (Object.keys(errors.value).length) return
    const amountText = allMode.value ? '全部余额' : `${amount.value.trim()} ${fromAsset.value.symbol}`
    const impact = quote.priceImpact !== null && quote.amountOut !== null ? `\n当前报价价格影响 ${quote.priceImpact.toFixed(2)}%。` : ''
    const ok = await confirm({
      title: '确认兑换',
      content: `将在 ${dex.value.name} 把 ${props.wallets.length} 个钱包的 ${amountText} 兑换为 ${toAsset.value.symbol}，滑点 ${slippage.value}%。${impact}\n\nToken 授权不足时会先发一笔 approve。此操作不可撤销。`,
      confirmText: '开始兑换',
      danger: false,
    })
    if (!ok) return

    running.value = true
    let failedWallets = 0
    await runPool(props.wallets, 3, async (w) => {
      progress[w.id].status = 'running'
      const r = await swapWallet({
        network: props.network,
        dex: dex.value,
        privateKey: w.privateKey,
        fromAsset: fromAsset.value,
        toAsset: toAsset.value,
        amountIn: allMode.value ? 'all' : parsedAmount.value,
        slippageBps: slippageBps.value,
        approveUnlimited: approveUnlimited.value,
        onLog: (line) => pushLog(w, line),
        onSent: (info) => txStore.add({ network: props.network, from: w.address, ...info }),
        onSettled: (id, receipt, error) => txStore.settle(id, receipt, error),
      })
      progress[w.id].status = r.failed ? 'failed' : 'done'
      if (r.failed) failedWallets++
    })
    running.value = false
    finished.value = true
    if (failedWallets) message.error(`完成，${failedWallets} 个钱包兑换失败，请查看日志`)
    else message.success('兑换完成')
    emit('done')
  }

  return {
    dexId, fromKey, toKey, fromAsset, toAsset, amount, allMode, slippage, approveUnlimited, errors, quote,
    progress, logs, running, finished, locked, single, dexOptions, assets, balances, balanceLoading,
    fromBalance, fromBalanceText, symbols, quoteIdleText, canStart, start,
  }
}
