<script setup>
import { ref } from 'vue'
import { RiAddLine, RiCloseLine } from '@remixicon/vue'
import MxInput from '@/components/MxInput.vue'
import MxButton from '@/components/MxButton.vue'
import MxTag from '@/components/MxTag.vue'
import MxAddress from '@/components/MxAddress.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { fetchTokenMeta } from '@/utils/chain'
import { isEvmAddress, isHttpUrl } from '@/utils/validate'
import { message } from '@/utils/message'

const props = defineProps({
  /** [{ address, symbol, decimals }] */
  modelValue: { type: Array, default: () => [] },
  /** 用于读取 Token 元数据的网络表单（需要 rpcUrl / chainId） */
  network: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const address = ref('')
const error = ref('')
const loading = ref(false)

/** 回车只添加 Token，不触发外层网络表单的提交 */
function onEnter(e) {
  e.preventDefault()
  add()
}

async function add() {
  const addr = address.value.trim()
  error.value = ''
  if (!isEvmAddress(addr)) {
    error.value = '合约地址格式不正确'
    return
  }
  if (props.modelValue.some((t) => t.address.toLowerCase() === addr.toLowerCase())) {
    error.value = '该 Token 已存在'
    return
  }
  if (!isHttpUrl(props.network.rpcUrl) || !props.network.chainId) {
    error.value = '请先填写 RPC 地址与 Chain ID'
    return
  }
  loading.value = true
  try {
    const meta = await fetchTokenMeta(props.network, addr)
    emit('update:modelValue', [...props.modelValue, { address: addr, ...meta }])
    address.value = ''
    message.success(`已添加 ${meta.symbol}`)
  } catch {
    error.value = '读取 Token 信息失败，请检查合约地址与 RPC'
  } finally {
    loading.value = false
  }
}

function remove(i) {
  emit('update:modelValue', props.modelValue.filter((_, idx) => idx !== i))
}
</script>

<template>
  <div class="token-list">
    <div class="token-list__add">
      <MxInput v-model="address" size="sm" placeholder="ERC20 合约地址，添加后自动读取符号与精度" :error="error" class="token-list__input" @enter="onEnter" />
      <MxTooltip content="添加 Token">
        <MxButton icon size="sm" aria-label="添加 Token" :loading="loading" @click="add"><RiAddLine size="16" /></MxButton>
      </MxTooltip>
    </div>
    <div v-if="modelValue.length" class="token-list__items">
      <div v-for="(t, i) in modelValue" :key="t.address" class="token-item">
        <MxTag type="primary">{{ t.symbol }}</MxTag>
        <MxAddress :address="t.address" :head="10" :tail="8" />
        <span class="token-item__decimals">{{ t.decimals }} 位</span>
        <MxTooltip content="移除">
          <MxButton icon size="xs" type="surface" aria-label="移除 Token" @click="remove(i)"><RiCloseLine size="14" /></MxButton>
        </MxTooltip>
      </div>
    </div>
    <p v-else class="token-list__empty">未配置 Token，一键清空时只处理原生币</p>
  </div>
</template>

<style scoped>
.token-list {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.token-list__add {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
}

.token-list__input {
  flex: 1;
}

.token-list__items {
  display: flex;
  flex-direction: column;
}

.token-item {
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

.token-item__decimals {
  margin-left: auto;
  color: var(--mx-color-text-secondary);
}

.token-list__empty {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
