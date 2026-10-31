import { computed, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { collectFromWallet, runPool } from '@/utils/chain'
import { formatAmount } from '@/utils/format'
import { validate, rules } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { networkAssets, preferredAssetKey, assetBalanceOf } from './useTransferForm'
import { useWalletProgress } from './useDrainTask'

/**
 * 聚合转账：多个钱包把同一种资产转到一个地址，可全部余额或每个钱包固定数量。
 * props 需要 modelValue、wallets、network
 */
export function useCollectTask(props, emit) {
  const walletStore = useWalletStore()
  const txStore = useTxStore()

  const to = ref('')
  const assetKey = ref('')
  const amount = ref('')
  const allMode = ref(true)
  const errors = ref({})
  const running = ref(false)
  trackBusy(running)
  const finished = ref(false)
  const { progress, logs, resetProgress, pushLog } = useWalletProgress(() => props.wallets)

  const assets = computed(() => networkAssets(props.network))
  const asset = computed(() => assets.value.find((a) => a.key === assetKey.value) ?? assets.value[0] ?? null)
  const locked = computed(() => running.value || finished.value)

  /** 各钱包当前资产余额（来自余额缓存，打开时刷新一次） */
  const balanceLoading = computed(() => props.wallets.some((w) => walletStore.getBalance(props.network?.id, w.address)?.loading))
  const balances = computed(() => {
    if (!props.network || !asset.value) return {}
    return Object.fromEntries(props.wallets.map((w) => [w.id, assetBalanceOf(walletStore, props.network, w.address, asset.value)]))
  })
  /** 汇总：total 为 null 表示有钱包余额查不到；holders 为余额大于 0 的钱包数 */
  const summary = computed(() => {
    let total = 0n
    let holders = 0
    let unknown = 0
    for (const w of props.wallets) {
      const raw = balances.value[w.id]
      if (raw === null || raw === undefined) unknown++
      else {
        total += raw
        if (raw > 0n) holders++
      }
    }
    return { total, holders, unknown }
  })
  const totalText = computed(() => (asset.value ? formatAmount(summary.value.total, asset.value.decimals, 6) : ''))
  /** 资产下拉选项：带全部钱包的合计余额 */
  const assetOptions = computed(() =>
    assets.value.map((a) => {
      let sum = 0n
      let known = false
      for (const w of props.wallets) {
        const raw = props.network ? assetBalanceOf(walletStore, props.network, w.address, a) : null
        if (raw !== null) {
          sum += raw
          known = true
        }
      }
      return { label: a.symbol, value: a.key, balance: known ? formatAmount(sum, a.decimals, 6) : '—' }
    }),
  )

  const parsedAmount = computed(() => {
    const s = amount.value.trim()
    if (!s || !asset.value) return null
    try {
      return parseUnits(s, asset.value.decimals)
    } catch {
      return null
    }
  })

  /** 固定数量模式下余额不足的钱包数，提前提示 */
  const shortCount = computed(() => {
    if (allMode.value || parsedAmount.value === null) return 0
    return props.wallets.filter((w) => balances.value[w.id] !== null && balances.value[w.id] !== undefined && balances.value[w.id] < parsedAmount.value).length
  })

  const canStart = computed(() => !locked.value && !!asset.value && props.wallets.length > 0)

  function reset() {
    to.value = ''
    assetKey.value = preferredAssetKey(assets.value)
    amount.value = ''
    allMode.value = true
    errors.value = {}
    running.value = false
    finished.value = false
    resetProgress()
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v || !props.network) return
      reset()
      walletStore.refreshBalances(props.network, props.wallets.map((w) => w.address))
    },
  )

  /* 执行前把每个钱包的可用余额显示在进度列表的说明列 */
  watch([balances, asset], () => {
    if (locked.value || !asset.value) return
    props.wallets.forEach((w) => {
      const raw = balances.value[w.id]
      if (!progress[w.id]) return
      progress[w.id].last = raw === null || raw === undefined ? '' : `可用 ${formatAmount(raw, asset.value.decimals, 6)} ${asset.value.symbol}`
      progress[w.id].lastType = 'info'
    })
  })

  function validateForm() {
    const errs = validate({ to: to.value }, { to: [rules.required('请输入接收地址'), rules.address()] })
    if (!allMode.value) {
      if (!amount.value.trim()) errs.amount = '请输入数量，或选择全部余额'
      else if (parsedAmount.value === null) errs.amount = `数量格式不正确（最多 ${asset.value.decimals} 位小数）`
      else if (parsedAmount.value <= 0n) errs.amount = '数量须大于 0'
    }
    return errs
  }

  async function start() {
    errors.value = validateForm()
    if (Object.keys(errors.value).length) return
    const target = to.value.trim()
    const a = asset.value
    const amountText = allMode.value ? `全部 ${a.symbol}（当前合计约 ${totalText.value}）` : `各 ${amount.value.trim()} ${a.symbol}`
    const extra = a.native && allMode.value ? '\n原生币会扣除手续费后全部转出。' : ''
    const ok = await confirm({
      title: '确认聚合转账',
      content: `将把 ${props.wallets.length} 个钱包的 ${amountText} 转入：\n${target}${extra}\n\n此操作不可撤销。`,
      confirmText: '开始转账',
      danger: false,
    })
    if (!ok) return

    running.value = true
    let failed = 0
    await runPool(props.wallets, 3, async (w) => {
      progress[w.id].status = 'running'
      const r = await collectFromWallet({
        network: props.network,
        privateKey: w.privateKey,
        to: target,
        asset: a,
        amount: allMode.value ? 'all' : parsedAmount.value,
        onLog: (line) => pushLog(w, line),
        onSent: (info) => txStore.add({ kind: 'collect', network: props.network, from: w.address, ...info }),
        onSettled: (id, receipt, error) => txStore.settle(id, receipt, error),
      })
      progress[w.id].status = r.failed ? 'failed' : 'done'
      if (r.failed) failed++
    })
    running.value = false
    finished.value = true
    if (failed) message.error(`完成，${failed} 个钱包转出失败，请查看日志`)
    else message.success('聚合转账完成')
    emit('done')
  }

  return {
    to, assetKey, amount, allMode, errors, running, finished, locked,
    asset, assets, assetOptions, balanceLoading, summary, totalText, shortCount,
    progress, logs, canStart, start,
  }
}
