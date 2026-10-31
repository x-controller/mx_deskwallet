<script setup>
import { RiAddLine, RiCloseLine } from '@remixicon/vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxAddress from '@/themes/classic/components/MxAddress.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
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
          <MxTooltip v-if="d.version === 'v3'" :content="v3Detail(d)">
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
