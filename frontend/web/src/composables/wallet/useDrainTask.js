import { computed, reactive, ref, watch } from 'vue'
import { useTxStore } from '@/stores/tx'
import { trackBusy } from '@/utils/busy'
import { drainWallet, fetchNativeBalance, fetchTokenBalance, runPool } from '@/utils/chain'
import { validate, rules } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { NATIVE_KEY } from './useTransferForm'

/** 批量任务通用的每钱包进度与日志（清空 / 兑换共用） */
export function useWalletProgress(wallets) {
  const progress = reactive({})
  const logs = ref([])

  function resetProgress() {
    Object.keys(progress).forEach((k) => delete progress[k])
    logs.value = []
    wallets().forEach((w) => {
      progress[w.id] = { status: 'pending', last: '', lastType: 'info' }
    })
  }

  function pushLog(wallet, { type, text }) {
    logs.value.push({ id: logs.value.length, name: wallet.name, type, text })
    progress[wallet.id].last = text
    progress[wallet.id].lastType = type
  }

  return { progress, logs, resetProgress, pushLog }
}

/** 一键清空：选资产、汇总余额、按钱包并发执行并记录进度。props 需要 modelValue、wallets、network */
export function useDrainTask(props, emit) {
  const txStore = useTxStore()
  const to = ref('')
  const errors = ref({})
  const checked = ref(new Set())
  const totals = reactive({})
  const running = ref(false)
  trackBusy(running)
  const finished = ref(false)
  const { progress, logs, resetProgress, pushLog } = useWalletProgress(() => props.wallets)

  const assets = computed(() => {
    if (!props.network) return []
    return [
      ...props.network.tokens.map((t) => ({ key: t.address.toLowerCase(), ...t })),
      { key: NATIVE_KEY, symbol: props.network.symbol, decimals: 18, native: true },
    ]
  })

  const checkedTokens = computed(() => assets.value.filter((a) => !a.native && checked.value.has(a.key)))
  const includeNative = computed(() => checked.value.has(NATIVE_KEY))
  const canStart = computed(() => !running.value && !finished.value && checked.value.size > 0 && props.wallets.length > 0)
  const locked = computed(() => running.value || finished.value)

  function reset() {
    to.value = ''
    errors.value = {}
    checked.value = new Set(assets.value.map((a) => a.key))
    Object.keys(totals).forEach((k) => delete totals[k])
    running.value = false
    finished.value = false
    resetProgress()
  }

  async function loadTotals() {
    const net = props.network
    assets.value.forEach((a) => {
      totals[a.key] = { raw: 0n, loading: true, failed: false }
    })
    const jobs = assets.value.flatMap((a) => props.wallets.map((w) => ({ a, w })))
    await runPool(jobs, 8, async ({ a, w }) => {
      try {
        const bal = a.native ? await fetchNativeBalance(net, w.address) : await fetchTokenBalance(net, a.address, w.address)
        totals[a.key].raw += bal
      } catch {
        totals[a.key].failed = true
      }
    })
    assets.value.forEach((a) => {
      totals[a.key].loading = false
      if (totals[a.key].failed) totals[a.key].raw = null
    })
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (!v) return
      reset()
      loadTotals()
    },
  )

  function toggle(key, on) {
    const next = new Set(checked.value)
    on ? next.add(key) : next.delete(key)
    checked.value = next
  }

  async function start() {
    errors.value = validate({ to: to.value }, { to: [rules.required('请输入接收地址'), rules.address()] })
    if (Object.keys(errors.value).length) return
    const target = to.value.trim()
    const names = [...checkedTokens.value.map((t) => t.symbol), ...(includeNative.value ? [props.network.symbol] : [])]
    const ok = await confirm({
      title: '确认清空',
      content: `将把 ${props.wallets.length} 个钱包中的 ${names.join('、')} 全部转入：\n${target}\n\n先转出 Token，再把原生币扣除 gas 后全部转出。此操作不可撤销。`,
      confirmText: '开始清空',
    })
    if (!ok) return

    running.value = true
    let failedWallets = 0
    await runPool(props.wallets, 3, async (w) => {
      progress[w.id].status = 'running'
      const r = await drainWallet({
        network: props.network,
        privateKey: w.privateKey,
        to: target,
        tokens: checkedTokens.value,
        includeNative: includeNative.value,
        onLog: (line) => pushLog(w, line),
        onSent: (info) => txStore.add({ kind: 'drain', network: props.network, from: w.address, ...info }),
        onSettled: (id, receipt, error) => txStore.settle(id, receipt, error),
      })
      progress[w.id].status = r.failed ? 'failed' : 'done'
      if (r.failed) failedWallets++
      if (!r.failed && !r.success) pushLog(w, { type: 'info', text: '没有可转出的资产' })
    })
    running.value = false
    finished.value = true
    if (failedWallets) message.error(`完成，${failedWallets} 个钱包有失败项，请查看日志`)
    else message.success('清空完成')
    emit('done')
  }

  return { to, errors, checked, totals, progress, logs, running, finished, locked, assets, canStart, toggle, start }
}
