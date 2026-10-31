import { computed, reactive, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { estimateTransfer, sendTransfer, waitTx, errorText } from '@/utils/chain'
import { formatAmount } from '@/utils/format'
import { validate, rules, isEvmAddress } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

export const NATIVE_KEY = 'native'

/** 当前网络的可转资产列表：原生币 + 配置的 Token，key 为 native 或合约地址小写 */
export function networkAssets(network) {
  if (!network) return []
  return [
    { key: NATIVE_KEY, native: true, symbol: network.symbol, decimals: 18 },
    ...(network.tokens ?? []).map((t) => ({ key: t.address.toLowerCase(), ...t })),
  ]
}

/** 批量 / 聚合转账的默认资产：优先 USDT，其次第一个 Token，再退回原生币 */
export function preferredAssetKey(assets) {
  const usdt = assets.find((a) => !a.native && String(a.symbol).toUpperCase() === 'USDT')
  return (usdt ?? assets.find((a) => !a.native) ?? assets[0])?.key ?? NATIVE_KEY
}

/** 钱包在某网络上某资产的余额：余额未加载 / 查询失败返回 null */
export function assetBalanceOf(walletStore, network, address, asset) {
  const b = walletStore.getBalance(network.id, address)
  if (!b || b.loading) return null
  const raw = asset.native ? b.raw : b.tokens?.[asset.key]
  return raw === undefined ? null : raw
}

/** 转账弹框：资产选择、余额、手续费估算（防抖）、全部、校验、发送与后台等待上链。props 需要 modelValue、wallet、network */
export function useTransferForm(props, emit) {
  const walletStore = useWalletStore()
  const txStore = useTxStore()

  const assetKey = ref(NATIVE_KEY)
  const to = ref('')
  const amount = ref('')
  const errors = ref({})
  const sending = ref(false)
  trackBusy(sending)
  /** 手续费估算：loading / fee(bigint) / gasLimit / feeData / error */
  const estimate = reactive({ loading: false, fee: null, gasLimit: null, feeData: null, error: '' })

  const assets = computed(() => networkAssets(props.network))
  const asset = computed(() => assets.value.find((a) => a.key === assetKey.value) ?? assets.value[0])

  const balance = computed(() => (props.wallet && props.network ? walletStore.getBalance(props.network.id, props.wallet.address) : null))
  const nativeBalance = computed(() => balance.value?.raw ?? null)
  const assetBalance = computed(() => {
    if (!balance.value || balance.value.loading) return null
    return asset.value?.native ? nativeBalance.value : (balance.value.tokens?.[asset.value.key] ?? null)
  })
  const balanceText = (a) => {
    if (!balance.value || balance.value.loading) return ''
    const raw = a.native ? nativeBalance.value : balance.value.tokens?.[a.key]
    return raw === null || raw === undefined ? '—' : formatAmount(raw, a.decimals, 6)
  }
  const assetOptions = computed(() => assets.value.map((a) => ({ label: a.symbol, value: a.key, balance: balanceText(a) })))
  const assetBalanceText = computed(() => (assetBalance.value === null ? '—' : formatAmount(assetBalance.value, asset.value.decimals, 6)))
  const feeText = computed(() => (estimate.fee === null ? '' : formatAmount(estimate.fee, 18, 8)))

  /** 金额解析：返回 bigint，格式不对返回 null */
  const parsedAmount = computed(() => {
    const s = amount.value.trim()
    if (!s) return null
    try {
      return parseUnits(s, asset.value.decimals)
    } catch {
      return null
    }
  })

  function reset() {
    assetKey.value = NATIVE_KEY
    to.value = ''
    amount.value = ''
    errors.value = {}
    sending.value = false
    Object.assign(estimate, { loading: false, fee: null, gasLimit: null, feeData: null, error: '' })
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v || !props.wallet || !props.network) return
      reset()
      walletStore.refreshBalances(props.network, [props.wallet.address])
    },
  )

  /* 地址 / 金额 / 资产变化后延迟估算手续费 */
  let estimateTimer
  let estimateSeq = 0
  async function runEstimate() {
    const seq = ++estimateSeq
    const value = parsedAmount.value
    if (!isEvmAddress(to.value) || !value || value <= 0n) {
      Object.assign(estimate, { loading: false, fee: null, gasLimit: null, feeData: null, error: '' })
      return null
    }
    estimate.loading = true
    estimate.error = ''
    try {
      const r = await estimateTransfer({ network: props.network, from: props.wallet.address, to: to.value.trim(), asset: asset.value, amount: value })
      if (seq !== estimateSeq) return null
      Object.assign(estimate, { loading: false, fee: r.fee, gasLimit: r.gasLimit, feeData: r.feeData })
      return r
    } catch (e) {
      if (seq !== estimateSeq) return null
      Object.assign(estimate, { loading: false, fee: null, gasLimit: null, feeData: null, error: errorText(e) })
      return null
    }
  }

  watch([to, amount, assetKey], () => {
    clearTimeout(estimateTimer)
    estimateTimer = setTimeout(runEstimate, 400)
  })

  /** 全部：Token 取整笔余额，原生币扣掉当前估算的最高手续费 */
  async function fillMax() {
    if (assetBalance.value === null) return
    if (!asset.value.native) {
      amount.value = formatAmount(assetBalance.value, asset.value.decimals, asset.value.decimals)
      return
    }
    let fee = estimate.fee
    if (fee === null) {
      if (!isEvmAddress(to.value)) {
        errors.value = { to: '请先填写接收地址，以便估算手续费' }
        return
      }
      amount.value = '1'
      const r = await runEstimate()
      if (!r) return
      fee = r.fee
    }
    const max = assetBalance.value - fee
    if (max <= 0n) {
      errors.value = { amount: `${asset.value.symbol} 余额不足以支付手续费` }
      amount.value = ''
      return
    }
    errors.value = {}
    amount.value = formatAmount(max, 18, 18)
  }

  function validateForm(fee) {
    const errs = validate({ to: to.value }, { to: [rules.required('请输入接收地址'), rules.address()] })
    const value = parsedAmount.value
    if (!amount.value.trim()) errs.amount = '请输入金额'
    else if (value === null) errs.amount = `金额格式不正确（最多 ${asset.value.decimals} 位小数）`
    else if (value <= 0n) errs.amount = '金额须大于 0'
    else if (assetBalance.value !== null && value > assetBalance.value) errs.amount = `超过可用余额 ${formatAmount(assetBalance.value, asset.value.decimals, 6)}`
    else if (fee !== null && nativeBalance.value !== null) {
      const need = asset.value.native ? value + fee : fee
      if (need > nativeBalance.value) errs.amount = `${props.network.symbol} 不足以支付手续费（约需 ${formatAmount(fee, 18, 8)}）`
    }
    return errs
  }

  async function submit() {
    errors.value = validateForm(estimate.fee)
    if (Object.keys(errors.value).length) return
    sending.value = true
    try {
      // 发送前用最新费率重估一次，确保 maxFee 与余额校验一致
      const est = await runEstimate()
      if (!est) {
        errors.value = { amount: estimate.error ? `手续费估算失败：${estimate.error}` : '手续费估算失败，请重试' }
        return
      }
      errors.value = validateForm(est.fee)
      if (Object.keys(errors.value).length) return

      const value = parsedAmount.value
      const target = to.value.trim()
      const ok = await confirm({
        title: '确认转账',
        content: `从「${props.wallet.name}」转出 ${formatAmount(value, asset.value.decimals, 8)} ${asset.value.symbol} 至：\n${target}\n\n最高手续费约 ${formatAmount(est.fee, 18, 8)} ${props.network.symbol}。此操作不可撤销。`,
        confirmText: '确认转账',
        danger: false,
      })
      if (!ok) return

      const tx = await sendTransfer({
        network: props.network,
        privateKey: props.wallet.privateKey,
        to: target,
        asset: asset.value,
        amount: value,
        gasLimit: est.gasLimit,
        feeData: est.feeData,
      })
      const id = txStore.add({ kind: 'transfer', network: props.network, from: props.wallet.address, to: target, hash: tx.hash, nonce: tx.nonce, asset: asset.value, amount: value })
      const label = `${formatAmount(value, asset.value.decimals, 6)} ${asset.value.symbol}`
      message.success(`已广播 ${label}，等待确认`)
      emit('update:modelValue', false)
      // 后台等待上链，结果写回记录并提示
      waitTx(tx, (receipt, error) => txStore.settle(id, receipt, error))
        .then(() => message.success(`「${props.wallet.name}」转出 ${label} 已确认`))
        .catch((e) => message.error(`「${props.wallet.name}」转出 ${label} 失败：${errorText(e)}`))
        .finally(() => emit('done'))
    } catch (e) {
      message.error(`转账失败：${errorText(e)}`)
    } finally {
      sending.value = false
    }
  }

  return { assetKey, to, amount, errors, sending, estimate, asset, balance, assetBalance, assetBalanceText, feeText, assetOptions, fillMax, submit }
}
