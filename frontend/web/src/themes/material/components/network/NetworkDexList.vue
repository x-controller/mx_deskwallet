<script setup>
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { useNetworkDexList } from '@/composables/network/useNetworkDexList'

const props = defineProps({
  /** [{ id, name, version, router, quoter?, feeTiers?, wrappedNative }] */
  modelValue: { type: Array, default: () => [] },
  /** 用于读取路由信息的网络表单（需要 rpcUrl / chainId） */
  network: { type: Object, required: true },
})

const emit = defineEmits(['update:modelValue'])

const { name, version, router, quoter, feeTiers, errors, loading, isV3, onEnter, add, remove, v3Detail, DEX_VERSIONS } = useNetworkDexList(props, emit)
</script>

<template>
  <div class="dex-list">
    <div class="dex-list__row">
      <MdTextField v-model="name" dense label="交易所名称" placeholder="如 Uniswap V3" :maxlength="30" :error="errors.name" class="dex-list__name" @enter="onEnter" />
      <MdSelect v-model="version" dense label="协议版本" :options="DEX_VERSIONS" class="dex-list__version" />
    </div>
    <MdTextField v-model="router" dense label="Router 合约地址" :supporting-text="isV3 ? 'SwapRouter02 / SmartRouter' : '自动读取包装币'" :error="errors.router" mono @enter="onEnter">
      <template #trailing>
        <MdTooltip content="添加交易所">
          <MdIconButton size="sm" aria-label="添加交易所" :loading="loading" @click="add"><MdIcon name="add" /></MdIconButton>
        </MdTooltip>
      </template>
    </MdTextField>
    <div v-if="isV3" class="dex-list__row">
      <MdTextField v-model="quoter" dense label="QuoterV2 合约地址" :error="errors.quoter" class="dex-list__name" mono @enter="onEnter" />
      <MdTextField v-model="feeTiers" dense label="手续费档位" placeholder="100,500,3000,10000" :error="errors.feeTiers" class="dex-list__version" @enter="onEnter" />
    </div>

    <div v-if="modelValue.length" class="dex-list__items">
      <div v-for="(d, i) in modelValue" :key="d.id" class="dex-item md-body-small">
        <MdChip tone="primary">{{ d.name }}</MdChip>
        <MdChip :tone="d.version === 'v3' ? 'secondary' : 'neutral'">{{ (d.version || 'v2').toUpperCase() }}</MdChip>
        <MdAddress :address="d.router" :head="8" :tail="6" label="Router 地址" />
        <span class="dex-item__metas">
          <MdTooltip v-if="d.version === 'v3'" :content="v3Detail(d)">
            <span class="dex-item__meta">{{ (d.feeTiers ?? []).length }} 档</span>
          </MdTooltip>
          <MdTooltip :content="`包装币 ${d.wrappedNative}`">
            <span class="dex-item__meta">W{{ network.symbol || '…' }}</span>
          </MdTooltip>
        </span>
        <MdTooltip content="移除">
          <MdIconButton size="xs" aria-label="移除交易所" @click="remove(i)"><MdIcon name="close" /></MdIconButton>
        </MdTooltip>
      </div>
    </div>
    <p v-else class="dex-list__empty md-body-small">未配置交易所，该网络无法兑换</p>
  </div>
</template>

<style scoped>
.dex-list {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-3);
}

.dex-list__row {
  display: grid;
  grid-template-columns: 1fr 260px;
  align-items: flex-start;
  gap: var(--md-space-3);
}

.dex-list__items {
  display: flex;
  flex-direction: column;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  overflow: hidden;
}

.dex-item {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: 40px;
  padding: 0 var(--md-space-2) 0 var(--md-space-3);
  border-bottom: 1px solid var(--md-sys-color-outline-variant);
  color: var(--md-sys-color-on-surface);
}

.dex-item:last-child {
  border-bottom: none;
}

.dex-item__metas {
  display: inline-flex;
  gap: var(--md-space-3);
  margin-left: auto;
}

.dex-item__meta {
  color: var(--md-sys-color-on-surface-variant);
}

.dex-list__empty {
  margin: 0 var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
}
</style>
