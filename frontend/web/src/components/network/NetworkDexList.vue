<script setup>
import { computed, ref } from 'vue'
import { RiAddLine, RiCloseLine } from '@remixicon/vue'
import MxInput from '@/components/MxInput.vue'
import MxSelect from '@/components/MxSelect.vue'
import MxButton from '@/components/MxButton.vue'
import MxTag from '@/components/MxTag.vue'
import MxAddress from '@/components/MxAddress.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { DEX_VERSIONS, FEE_TIERS_UNISWAP, feeTierLabel, fetchDexWrapped } from '@/utils/dex'
import { isEvmAddress, isHttpUrl } from '@/utils/validate'
import { message } from '@/utils/message'

const props = defineProps({
  /** [{ id, name, version, router, quoter?, feeTiers?, wrappedNative }] */
  modelValue: { type: Array, default: () => [] },
  /** 用于读取路由信息的网络表单（需要 rpcUrl / chainId） */
  network: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const name = ref('')
const version = ref('v2')
const router = ref('')
const quoter = ref('')
const feeTiers = ref(FEE_TIERS_UNISWAP.join(','))
const errors = ref({})
const loading = ref(false)

const isV3 = computed(() => version.value === 'v3')

/** 回车只添加交易所，不触发外层网络表单的提交 */
function onEnter(e) {
  e.preventDefault()
  add()
}

function parseFeeTiers() {
  const list = feeTiers.value
    .split(/[,，\s]+/)
    .filter(Boolean)
    .map(Number)
  if (!list.length || list.some((n) => !Number.isInteger(n) || n <= 0 || n >= 1000000)) return null
  return [...new Set(list)].sort((a, b) => a - b)
}

async function add() {
  const n = name.value.trim()
  const r = router.value.trim()
  const q = quoter.value.trim()
  const tiers = isV3.value ? parseFeeTiers() : []
  errors.value = {}
  if (!n) errors.value.name = '请输入交易所名称'
  if (!isEvmAddress(r)) errors.value.router = 'Router 合约地址格式不正确'
  else if (props.modelValue.some((d) => d.router.toLowerCase() === r.toLowerCase())) errors.value.router = '该 Router 已存在'
  if (isV3.value && !isEvmAddress(q)) errors.value.quoter = 'Quoter 合约地址格式不正确'
  if (isV3.value && !tiers) errors.value.feeTiers = '手续费档位须为正整数（万分比），逗号分隔'
  if (Object.keys(errors.value).length) return
  if (!isHttpUrl(props.network.rpcUrl) || !props.network.chainId) {
    errors.value = { router: '请先填写 RPC 地址与 Chain ID' }
    return
  }
  const dex = isV3.value
    ? { id: crypto.randomUUID(), name: n, version: 'v3', router: r, quoter: q, feeTiers: tiers }
    : { id: crypto.randomUUID(), name: n, version: 'v2', router: r }
  loading.value = true
  try {
    dex.wrappedNative = await fetchDexWrapped(props.network, dex)
    emit('update:modelValue', [...props.modelValue, dex])
    name.value = ''
    router.value = ''
    quoter.value = ''
    message.success(`已添加 ${n}`)
  } catch (e) {
    errors.value = { router: isV3.value ? `读取路由信息失败：${e?.shortMessage || e?.message || '请确认 Router / Quoter 地址'}` : '读取路由信息失败，请确认是 Uniswap V2 兼容的 Router 合约' }
  } finally {
    loading.value = false
  }
}

function remove(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>

<template>
  <div class="dex-list">
    <div class="dex-list__add">
      <MxInput v-model="name" size="sm" placeholder="名称，如 Uniswap V3" :maxlength="30" :error="errors.name" class="dex-list__name" @enter="onEnter" />
      <MxSelect v-model="version" size="sm" :options="DEX_VERSIONS" class="dex-list__version" />
    </div>
    <div class="dex-list__add">
      <MxInput v-model="router" size="sm" :placeholder="isV3 ? 'SwapRouter02 / SmartRouter 合约地址' : 'V2 Router 合约地址，自动读取包装币'" :error="errors.router" class="dex-list__router" @enter="onEnter" />
      <MxTooltip content="添加交易所">
        <MxButton icon size="sm" aria-label="添加交易所" :loading="loading" @click="add"><RiAddLine size="16" /></MxButton>
      </MxTooltip>
    </div>
    <div v-if="isV3" class="dex-list__add">
      <MxInput v-model="quoter" size="sm" placeholder="QuoterV2 合约地址" :error="errors.quoter" class="dex-list__router" @enter="onEnter" />
      <MxInput v-model="feeTiers" size="sm" placeholder="手续费档位，如 100,500,3000,10000" :error="errors.feeTiers" class="dex-list__tiers" @enter="onEnter" />
    </div>

    <div v-if="modelValue.length" class="dex-list__items">
      <div v-for="(d, i) in modelValue" :key="d.id" class="dex-item">
        <MxTag type="primary">{{ d.name }}</MxTag>
        <MxTag :type="d.version === 'v3' ? 'info' : 'default'">{{ (d.version || 'v2').toUpperCase() }}</MxTag>
        <MxAddress :address="d.router" :head="8" :tail="6" label="Router 地址" />
        <span class="dex-item__metas">
          <MxTooltip v-if="d.version === 'v3'" :content="`Quoter ${d.quoter}\n档位 ${(d.feeTiers ?? []).map(feeTierLabel).join(' / ')}`">
            <span class="dex-item__meta">{{ (d.feeTiers ?? []).length }} 档</span>
          </MxTooltip>
          <MxTooltip :content="`包装币 ${d.wrappedNative}`">
            <span class="dex-item__meta">W{{ network.symbol || '…' }}</span>
          </MxTooltip>
        </span>
        <MxTooltip content="移除">
          <MxButton icon size="xs" type="surface" aria-label="移除交易所" @click="remove(i)"><RiCloseLine size="14" /></MxButton>
        </MxTooltip>
      </div>
    </div>
    <p v-else class="dex-list__empty">未配置交易所，该网络无法兑换</p>
  </div>
</template>

<style scoped>
.dex-list {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.dex-list__add {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
}

.dex-list__name {
  flex: 1;
}

.dex-list__version {
  width: 260px;
  flex-shrink: 0;
}

.dex-list__router {
  flex: 1;
}

.dex-list__tiers {
  width: 220px;
  flex-shrink: 0;
}

.dex-list__items {
  display: flex;
  flex-direction: column;
}

.dex-item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-sm);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-xs) 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.dex-item__metas {
  display: inline-flex;
  gap: var(--mx-space-sm);
  margin-left: auto;
}

.dex-item__meta {
  color: var(--mx-color-text-secondary);
}

.dex-list__empty {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
