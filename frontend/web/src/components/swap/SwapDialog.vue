<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import MxCheckbox from '@/components/MxCheckbox.vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import WalletProgressList from '@/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/components/wallet/WalletLogPanel.vue'
import SwapAssetPicker, { CUSTOM_KEY } from './SwapAssetPicker.vue'
import SwapQuotePanel from './SwapQuotePanel.vue'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { runPool, errorText } from '@/utils/chain'
import { quoteSwap, applySlippage, swapWallet } from '@/utils/dex'
import { formatAmount } from '@/utils/format'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

const NATIVE_KEY = 'native'
const DEFAULT_SLIPPAGE = '0.5'
const MAX_SLIPPAGE = 50

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 要兑换的钱包列表 */
  wallets: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

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
const progress = reactive({})
const logs = ref([])
const running = ref(false)
const finished = ref(false)

const single = computed(() => props.wallets.length === 1)
const dexes = computed(() => props.network?.dexes ?? [])
const dex = computed(() => dexes.value.find((d) => d.id === dexId.value) ?? null)
const dexOptions = computed(() => dexes.value.map((d) => ({ label: `${d.name} · ${(d.version || 'v2').toUpperCase()}`, value: d.id })))
const locked = computed(() => running.value || finished.value)

const assets = computed(() => {
  if (!props.network) return []
  return [
    { key: NATIVE_KEY, native: true, symbol: props.network.symbol, decimals: 18 },
    ...(props.network.tokens ?? []).map((t) => ({ key: t.address.toLowerCase(), ...t })),
  ]
})

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
  Object.keys(progress).forEach((k) => delete progress[k])
  logs.value = []
  running.value = false
  finished.value = false
  props.wallets.forEach((w) => {
    progress[w.id] = { status: 'pending', last: '', lastType: 'info' }
  })
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

function pushLog(wallet, { type, text }) {
  logs.value.push({ id: logs.value.length, name: wallet.name, type, text })
  progress[wallet.id].last = text
  progress[wallet.id].lastType = type
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
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`兑换 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`"
    width="680px"
    :closable="!running"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="network" class="swap">
      <div class="swap__row">
        <span class="swap__label">交易所</span>
        <div class="swap__field">
          <MxSelect v-model="dexId" size="sm" :options="dexOptions" :disabled="locked" placeholder="选择交易所" />
          <p v-if="errors.dex" class="swap__error">{{ errors.dex }}</p>
        </div>
      </div>

      <div class="swap__row swap__row--pair">
        <div class="swap__row swap__half">
          <span class="swap__label">卖出</span>
          <div class="swap__field">
            <SwapAssetPicker v-model="fromKey" :assets="assets" :balances="balances" :loading="balanceLoading" :disabled="locked" @update:asset="fromAsset = $event" />
            <p v-if="errors.from" class="swap__error">{{ errors.from }}</p>
          </div>
        </div>
        <div class="swap__row swap__half">
          <span class="swap__label">买入</span>
          <div class="swap__field">
            <SwapAssetPicker v-model="toKey" :assets="assets" :balances="balances" :loading="balanceLoading" :network="network" allow-custom :disabled="locked" @update:asset="toAsset = $event" />
            <p v-if="errors.to" class="swap__error">{{ errors.to }}</p>
          </div>
        </div>
      </div>

      <div class="swap__row">
        <span class="swap__label">数量</span>
        <div class="swap__field">
          <div class="swap__amount">
            <MxInput v-model="amount" size="sm" :placeholder="allMode ? '全部余额' : '0.0'" :error="errors.amount" :disabled="locked || allMode" class="swap__amount-input">
              <template #suffix><span class="swap__symbol">{{ fromAsset?.symbol ?? '' }}</span></template>
            </MxInput>
            <MxCheckbox v-model="allMode" :disabled="locked">全部余额</MxCheckbox>
          </div>
          <p v-if="single" class="swap__hint">
            <span>可用</span>
            <MxSkeleton v-if="balanceLoading" width="72px" />
            <span v-else>{{ fromBalance === null ? '—' : formatAmount(fromBalance, fromAsset?.decimals ?? 18, 6) }} {{ fromAsset?.symbol ?? '' }}</span>
          </p>
          <p v-else class="swap__hint">每个钱包各自卖出该数量{{ allMode ? '' : '，余额不足的钱包会失败' }}</p>
        </div>
      </div>

      <div class="swap__row swap__row--pair">
        <div class="swap__row swap__half">
          <span class="swap__label">滑点</span>
          <div class="swap__field">
            <MxInput v-model="slippage" size="sm" :error="errors.slippage" :disabled="locked" class="swap__slippage">
              <template #suffix><span class="swap__symbol">%</span></template>
            </MxInput>
          </div>
        </div>
        <div class="swap__row swap__half swap__row--check">
          <MxCheckbox v-model="approveUnlimited" :disabled="locked || fromAsset?.native">无限授权（省下次 approve 的 gas）</MxCheckbox>
        </div>
      </div>

      <SwapQuotePanel :quote="quote" :from-asset="fromAsset" :to-asset="toAsset" :symbols="symbols" :idle-text="quoteIdleText" />

      <section v-if="running || finished" class="swap__section">
        <h3 class="swap__heading">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" />
      </section>

      <section v-if="logs.length" class="swap__section">
        <h3 class="swap__heading">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MxButton>
      <MxButton v-if="!finished" size="sm" type="primary" :disabled="!canStart" :loading="running" @click="start">开始兑换</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.swap {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.swap__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.swap__row--pair {
  gap: var(--mx-space-md);
}

.swap__half {
  flex: 1;
  min-width: 0;
}

.swap__row--check {
  align-items: center;
}

.swap__label {
  width: 48px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__half + .swap__half .swap__label {
  width: auto;
}

.swap__field {
  flex: 1;
  min-width: 0;
}

.swap__amount {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
}

.swap__amount-input {
  flex: 1;
}

.swap__amount :deep(.mx-checkbox) {
  height: var(--mx-size-sm);
}

.swap__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__slippage {
  max-width: 120px;
}

.swap__hint {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.swap__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
}

.swap__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.swap__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}
</style>
