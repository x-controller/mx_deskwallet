<script setup>
import { computed, reactive, ref, watch } from 'vue'
import { parseUnits } from 'ethers'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import MxSkeleton from '@/components/MxSkeleton.vue'
import MxAddress from '@/components/MxAddress.vue'
import { useWalletStore } from '@/stores/wallet'
import { useTxStore } from '@/stores/tx'
import { estimateTransfer, sendTransfer, waitTx, errorText } from '@/utils/chain'
import { formatAmount } from '@/utils/format'
import { validate, rules, isEvmAddress } from '@/utils/validate'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

const NATIVE_KEY = 'native'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 转出钱包 */
  wallet: { type: Object, default: null },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const walletStore = useWalletStore()
const txStore = useTxStore()

const assetKey = ref(NATIVE_KEY)
const to = ref('')
const amount = ref('')
const errors = ref({})
const sending = ref(false)
/** 手续费估算：loading / fee(bigint) / gasLimit / feeData / error */
const estimate = reactive({ loading: false, fee: null, gasLimit: null, feeData: null, error: '' })

const assets = computed(() => {
  if (!props.network) return []
  return [
    { key: NATIVE_KEY, native: true, symbol: props.network.symbol, decimals: 18 },
    ...(props.network.tokens ?? []).map((t) => ({ key: t.address.toLowerCase(), ...t })),
  ]
})
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
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`转账 · ${wallet?.name ?? ''} · ${network?.name ?? ''}`"
    width="520px"
    :closable="!sending"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="wallet && network" class="transfer">
      <div class="transfer__row">
        <span class="transfer__label">转出</span>
        <MxAddress :address="wallet.address" full button-type="default" class="transfer__field" />
      </div>

      <div class="transfer__row">
        <span class="transfer__label">资产</span>
        <MxSelect v-model="assetKey" size="sm" :options="assetOptions" :disabled="sending" class="transfer__field">
          <template #option="{ option }">
            <span class="transfer__option">
              <span>{{ option.label }}</span>
              <MxSkeleton v-if="balance?.loading" width="60px" />
              <span v-else class="transfer__option-balance">{{ option.balance }}</span>
            </span>
          </template>
        </MxSelect>
      </div>

      <div class="transfer__row">
        <span class="transfer__label">接收</span>
        <MxInput v-model="to" size="sm" placeholder="接收地址 0x..." :error="errors.to" :disabled="sending" autofocus class="transfer__field" />
      </div>

      <div class="transfer__row">
        <span class="transfer__label">金额</span>
        <div class="transfer__field">
          <MxInput v-model="amount" size="sm" placeholder="0.0" :error="errors.amount" :disabled="sending" @enter="submit">
            <template #suffix>
              <span class="transfer__symbol">{{ asset?.symbol }}</span>
              <MxButton size="xs" :disabled="sending || assetBalance === null" @click="fillMax">全部</MxButton>
            </template>
          </MxInput>
          <p class="transfer__hint">
            <span>可用</span>
            <MxSkeleton v-if="balance?.loading" width="72px" />
            <span v-else>{{ assetBalance === null ? '—' : formatAmount(assetBalance, asset.decimals, 6) }} {{ asset?.symbol }}</span>
            <span class="transfer__dot">·</span>
            <span>手续费</span>
            <MxSkeleton v-if="estimate.loading" width="90px" />
            <span v-else-if="estimate.error" class="is-error">估算失败</span>
            <span v-else-if="estimate.fee !== null">≤ {{ formatAmount(estimate.fee, 18, 8) }} {{ network.symbol }}</span>
            <span v-else>—</span>
          </p>
          <p v-if="estimate.error" class="transfer__error">{{ estimate.error }}</p>
        </div>
      </div>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="sending" @click="emit('update:modelValue', false)">取消</MxButton>
      <MxButton size="sm" type="primary" :loading="sending" :disabled="balance?.loading" @click="submit">转账</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.transfer {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.transfer__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.transfer__label {
  width: 40px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__field {
  flex: 1;
  min-width: 0;
  line-height: var(--mx-size-sm);
  word-break: break-all;
}

.transfer__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-space-md);
  width: 100%;
}

.transfer__option-balance {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mx-space-xs);
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.transfer__dot {
  color: var(--mx-color-text-disabled);
}

.transfer__error {
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-danger);
  word-break: break-all;
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
