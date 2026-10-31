<script setup>
import { RiAddLine, RiCloseLine } from '@remixicon/vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import { useNetworkTokenList } from '@/composables/network/useNetworkTokenList'

const props = defineProps({
  /** [{ address, symbol, decimals }] */
  modelValue: { type: Array, default: () => [] },
  /** 用于读取 Token 元数据的网络表单（需要 rpcUrl / chainId） */
  network: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const { address, error, loading, onEnter, add, remove } = useNetworkTokenList(props, emit)
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
