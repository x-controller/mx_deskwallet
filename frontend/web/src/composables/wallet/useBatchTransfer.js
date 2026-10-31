import { computed, reactive, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { batchTransfer, estimateTransfer, errorText } from '@/utils/chain'
import { formatAmount, shortAddress } from '@/utils/format'
import { isEvmAddress } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { networkAssets, preferredAssetKey, assetBalanceOf } from './useTransferForm'

/** 最多显示几条格式错误 */
const MAX_LINE_ERRORS = 5

/**
 * 批量转账：一个钱包向多个地址转同一种资产。收款列表每行「地址 金额」，没写金额的行用统一金额。
 * props 需要 modelValue、wallets（可选的转出钱包）、defaultWallet（打开时预选）、recipients（可一键填入的钱包）、network
 */
export function useBatchTransfer(props, emit) {
  const walletStore = useWalletStore()
  const txStore = useTxStore()

  const fromId = ref('')
  const assetKey = ref('')
  const text = ref('')
  const defaultAmount = ref('')
  const errors = ref({})
  const running = ref(false)
  trackBusy(running)
  const finished = ref(false)
  /** 每笔的执行状态：index → { status, last, lastType } */
  const progress = reactive({})
  const estimate = reactive({ loading: false, fee: null, error: '' })

  const wallet = computed(() => props.wallets.find((w) => w.id === fromId.value) ?? null)
  const walletOptions = computed(() => props.wallets.map((w) => ({ label: `${w.name} · ${shortAddress(w.address, 6, 4)}`, value: w.id })))
  const assets = computed(() => networkAssets(props.network))
  const asset = computed(() => assets.value.find((a) => a.key === assetKey.value) ?? assets.value[0] ?? null)
  const locked = computed(() => running.value || finished.value)

  const balance = computed(() => (wallet.value && props.network ? walletStore.getBalance(props.network.id, wallet.value.address) : null))
  const balanceLoading = computed(() => !!balance.value?.loading)
  const rawBalanceOf = (a) => (wallet.value && props.network ? assetBalanceOf(walletStore, props.network, wallet.value.address, a) : null)
  const assetBalance = computed(() => (asset.value ? rawBalanceOf(asset.value) : null))
  const nativeBalance = computed(() => (balance.value && !balance.value.loading ? balance.value.raw : null))
  const assetOptions = computed(() =>
    assets.value.map((a) => {
      const raw = rawBalanceOf(a)
      return { label: a.symbol, value: a.key, balance: raw === null ? '—' : formatAmount(raw, a.decimals, 6) }
    }),
  )

  const parsedDefault = computed(() => {
    const s = defaultAmount.value.trim()
    if (!s || !asset.value) return null
    try {
      const v = parseUnits(s, asset.value.decimals)
      return v > 0n ? v : null
    } catch {
      return null
    }
  })

  /** 解析收款列表：items 为合法条目，lineErrors 为各行问题 */
  const parsed = computed(() => {
    const items = []
    const lineErrors = []
    if (!asset.value) return { items, lineErrors }
    text.value.split(/\r?\n/).forEach((raw, i) => {
      const line = raw.trim()
      if (!line) return
      const [to, amountStr, ...rest] = line.split(/[\s,;，；]+/)
      const no = i + 1
      if (!isEvmAddress(to)) {
        lineErrors.push(`第 ${no} 行：地址格式不正确`)
        return
      }
      if (rest.length) {
        lineErrors.push(`第 ${no} 行：多余的内容「${rest.join(' ')}」`)
        return
      }
      let amount
      if (amountStr === undefined) {
        if (parsedDefault.value === null) {
          lineErrors.push(`第 ${no} 行：没有金额${defaultAmount.value.trim() ? '，且统一金额无效' : '，请在行内写金额或填写统一金额'}`)
          return
        }
        amount = parsedDefault.value
      } else {
        try {
          amount = parseUnits(amountStr, asset.value.decimals)
        } catch {
          lineErrors.push(`第 ${no} 行：金额格式不正确（最多 ${asset.value.decimals} 位小数）`)
          return
        }
        if (amount <= 0n) {
          lineErrors.push(`第 ${no} 行：金额须大于 0`)
          return
        }
      }
      items.push({ to, amount, line: no })
    })
    return { items, lineErrors }
  })
  const items = computed(() => parsed.value.items)
  const lineErrors = computed(() => parsed.value.lineErrors)
  const lineErrorText = computed(() => {
    const list = lineErrors.value
    if (!list.length) return ''
    const shown = list.slice(0, MAX_LINE_ERRORS)
    return list.length > MAX_LINE_ERRORS ? `${shown.join('；')}；等 ${list.length} 处问题` : shown.join('；')
  })
  const total = computed(() => items.value.reduce((sum, it) => sum + it.amount, 0n))
  const totalText = computed(() => (asset.value ? formatAmount(total.value, asset.value.decimals, 6) : ''))
  /** 手续费总额 = 单笔估算 × 笔数（ERC-20 给新地址转账会略多，按「约」展示） */
  const feeTotal = computed(() => (estimate.fee === null ? null : estimate.fee * BigInt(items.value.length)))
  const feeTotalText = computed(() => (feeTotal.value === null ? '' : formatAmount(feeTotal.value, 18, 6)))

  /** 进度列表复用钱包进度组件：把每笔当成一行 */
  const progressRows = computed(() => items.value.map((it, i) => ({ id: i, name: `${i + 1}. ${formatAmount(it.amount, asset.value.decimals, 6)} ${asset.value.symbol}`, address: it.to })))

  const canStart = computed(() => !locked.value && !!wallet.value && !!asset.value && items.value.length > 0 && !lineErrors.value.length && !balanceLoading.value)

  function reset() {
    fromId.value = props.defaultWallet && props.wallets.some((w) => w.id === props.defaultWallet.id) ? props.defaultWallet.id : (props.wallets[0]?.id ?? '')
    assetKey.value = preferredAssetKey(assets.value)
    text.value = ''
    defaultAmount.value = ''
    errors.value = {}
    running.value = false
    finished.value = false
    Object.keys(progress).forEach((k) => delete progress[k])
    Object.assign(estimate, { loading: false, fee: null, error: '' })
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v || !props.network) return
      reset()
      if (wallet.value) walletStore.refreshBalances(props.network, [wallet.value.address])
    },
  )

  watch(fromId, () => {
    if (props.modelValue && wallet.value && props.network) walletStore.refreshBalances(props.network, [wallet.value.address])
  })

  /* 用第一笔估算单笔手续费（防抖） */
  let estimateTimer
  let estimateSeq = 0
  async function runEstimate() {
    const seq = ++estimateSeq
    const first = items.value[0]
    if (!first || !wallet.value) {
      Object.assign(estimate, { loading: false, fee: null, error: '' })
      return null
    }
    // 余额明显不够时链上估算只会回滚（missing revert data），直接给出可读的提示
    if (assetBalance.value !== null && total.value > assetBalance.value) {
      Object.assign(estimate, { loading: false, fee: null, error: `${asset.value.symbol} 余额不足，无法估算手续费` })
      return null
    }
    estimate.loading = true
    estimate.error = ''
    try {
      const r = await estimateTransfer({ network: props.network, from: wallet.value.address, to: first.to, asset: asset.value, amount: first.amount })
      if (seq !== estimateSeq) return null
      Object.assign(estimate, { loading: false, fee: r.fee })
      return r
    } catch (e) {
      if (seq !== estimateSeq) return null
      Object.assign(estimate, { loading: false, fee: null, error: errorText(e) })
      return null
    }
  }

  watch([() => items.value[0]?.to, () => items.value[0]?.amount, fromId, assetKey], () => {
    clearTimeout(estimateTimer)
    estimateTimer = setTimeout(runEstimate, 400)
  })

  /** 可一键填入的收款钱包（排除转出钱包本身） */
  const fillable = computed(() => props.recipients.filter((w) => w.id !== fromId.value))

  function fillRecipients() {
    if (!fillable.value.length) {
      message.error('没有可填入的地址')
      return
    }
    text.value = fillable.value.map((w) => w.address).join('\n')
  }

  function validateForm(fee) {
    const errs = {}
    if (!wallet.value) errs.from = '请选择转出钱包'
    if (!items.value.length) errs.text = lineErrors.value.length ? lineErrorText.value : '请填写收款地址与金额'
    else if (lineErrors.value.length) errs.text = lineErrorText.value
    if (defaultAmount.value.trim() && parsedDefault.value === null) errs.defaultAmount = `统一金额格式不正确（最多 ${asset.value.decimals} 位小数且大于 0）`
    if (!errs.text && assetBalance.value !== null && total.value > assetBalance.value) {
      errs.text = `合计 ${totalText.value} ${asset.value.symbol} 超过可用余额 ${formatAmount(assetBalance.value, asset.value.decimals, 6)}`
    }
    if (!errs.text && fee !== null && nativeBalance.value !== null) {
      const need = asset.value.native ? total.value + fee : fee
      if (need > nativeBalance.value) errs.text = `${props.network.symbol} 不足以支付 ${items.value.length} 笔手续费（约需 ${formatAmount(fee, 18, 6)}）`
    }
    return errs
  }

  async function start() {
    errors.value = validateForm(feeTotal.value)
    if (Object.keys(errors.value).length) return
    running.value = true
    try {
      // 发送前用最新费率重估一次，确保余额校验与实际一致
      const est = await runEstimate()
      if (!est) {
        errors.value = { text: estimate.error ? `手续费估算失败：${estimate.error}` : '手续费估算失败，请重试' }
        return
      }
      const list = items.value
      const feeAll = est.fee * BigInt(list.length)
      errors.value = validateForm(feeAll)
      if (Object.keys(errors.value).length) return

      const a = asset.value
      const w = wallet.value
      const ok = await confirm({
        title: '确认批量转账',
        content: `从「${w.name}」向 ${list.length} 个地址转出合计 ${totalText.value} ${a.symbol}。\n\n手续费约 ${formatAmount(feeAll, 18, 6)} ${props.network.symbol}，各笔连续广播。此操作不可撤销。`,
        confirmText: '开始转账',
        danger: false,
      })
      if (!ok) return

      list.forEach((_, i) => {
        progress[i] = { status: 'pending', last: '', lastType: 'info' }
      })
      const r = await batchTransfer({
        network: props.network,
        privateKey: w.privateKey,
        asset: a,
        items: list,
        onUpdate: (i, { status, text: last }) => Object.assign(progress[i], { status, last, lastType: status === 'failed' ? 'error' : 'info' }),
        onSent: (i, info) => txStore.add({ kind: 'batch', network: props.network, from: w.address, note: `批量转账 第 ${i + 1} / ${list.length} 笔`, ...info }),
        onSettled: (id, receipt, error) => txStore.settle(id, receipt, error),
      })
      finished.value = true
      if (r.failed) message.error(`完成，${r.failed} 笔失败，请查看各笔状态`)
      else message.success(`批量转账完成，${r.success} 笔已确认`)
      emit('done', { from: w.address, recipients: list.map((it) => it.to) })
    } catch (e) {
      message.error(`批量转账失败：${errorText(e)}`)
    } finally {
      running.value = false
    }
  }

  return {
    fromId, assetKey, text, defaultAmount, errors, running, finished, locked,
    wallet, walletOptions, asset, assetOptions, balanceLoading, assetBalance,
    items, lineErrors, lineErrorText, totalText, estimate, feeTotalText,
    progress, progressRows, canStart, fillable, fillRecipients, start,
  }
}
