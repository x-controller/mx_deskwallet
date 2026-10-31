<script setup>
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
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
    <MdTextField v-model="address" dense label="ERC20 合约地址" supporting-text="添加后自动读取符号与精度" :error="error" mono @enter="onEnter">
      <template #trailing>
        <MdTooltip content="添加 Token">
          <MdIconButton size="sm" aria-label="添加 Token" :loading="loading" @click="add"><MdIcon name="add" /></MdIconButton>
        </MdTooltip>
      </template>
    </MdTextField>
    <div v-if="modelValue.length" class="token-list__items">
      <div v-for="(t, i) in modelValue" :key="t.address" class="token-item md-body-small">
        <MdChip tone="primary">{{ t.symbol }}</MdChip>
        <MdAddress :address="t.address" :head="10" :tail="8" />
        <span class="token-item__decimals">{{ t.decimals }} 位</span>
        <MdTooltip content="移除">
          <MdIconButton size="xs" aria-label="移除 Token" @click="remove(i)"><MdIcon name="close" /></MdIconButton>
        </MdTooltip>
      </div>
    </div>
    <p v-else class="token-list__empty md-body-small">未配置 Token，一键清空时只处理原生币</p>
  </div>
</template>

<style scoped>
.token-list {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.token-list__items {
  display: flex;
  flex-direction: column;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  overflow: hidden;
}

.token-item {
  display: flex;
  align-items: center;
  gap: var(--md-space-3);
  height: 40px;
  padding: 0 var(--md-space-2) 0 var(--md-space-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.token-item:last-child {
  border-bottom: none;
}

.token-item__decimals {
  margin-left: auto;
  color: var(--md-sys-color-on-surface-variant);
}

.token-list__empty {
  margin: 0 var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
