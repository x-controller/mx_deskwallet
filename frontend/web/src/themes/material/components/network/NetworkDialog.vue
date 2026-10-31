<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdNavItem from '@/themes/material/components/MdNavItem.vue'
import NetworkTokenList from './NetworkTokenList.vue'
import NetworkDexList from './NetworkDexList.vue'
import { useNetworkForm } from '@/composables/network/useNetworkForm'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { networkStore, selectedId, form, errors, saving, detecting, isNew, isTron, typeOptions, rpcPlaceholder, detectHint, symbolPlaceholder, select, createNew, detect, save, remove } = useNetworkForm(props)
</script>

<template>
  <MdDialog :model-value="modelValue" title="配置 RPC" width="800px" @update:model-value="emit('update:modelValue', $event)">
    <div class="network">
      <aside class="network__list">
        <MdNavItem v-for="n in networkStore.networks" :key="n.id" dense :active="selectedId === n.id" @click="select(n.id)">
          <template #icon><MdIcon name="hub" :size="20" /></template>
          {{ n.name }}
          <template #trailing>
            <MdChip v-if="n.id === networkStore.activeNetworkId" tone="primary">当前</MdChip>
            <span v-else class="network__chain">{{ n.type === 'tron' ? 'Tron' : n.chainId }}</span>
          </template>
        </MdNavItem>
        <MdNavItem dense :active="isNew" @click="createNew">
          <template #icon><MdIcon name="add" :size="20" /></template>
          新增网络
        </MdNavItem>
      </aside>

      <form class="network__form" @submit.prevent="save">
        <MdSelect v-model="form.type" dense label="链类型" :options="typeOptions" :disabled="!isNew" />
        <MdTextField v-model="form.name" dense label="名称" placeholder="如 Ethereum" :error="errors.name" />
        <MdTextField v-model="form.rpcUrl" dense :label="isTron ? '节点地址' : 'RPC 地址'" :placeholder="rpcPlaceholder" :error="errors.rpcUrl" mono>
          <template #trailing>
            <MdTooltip :content="detectHint">
              <MdIconButton size="sm" aria-label="检测 RPC" :loading="detecting" @click="detect"><MdIcon name="radar" /></MdIconButton>
            </MdTooltip>
          </template>
        </MdTextField>
        <MdTextField v-if="isTron" v-model="form.apiKey" dense label="TronGrid API Key（可选）" supporting-text="不填也能用，但受公共限流" mono />
        <div class="network__inline">
          <MdTextField v-if="!isTron" v-model="form.chainId" dense type="number" label="Chain ID" :error="errors.chainId" />
          <MdTextField v-model="form.symbol" dense label="原生币符号" :placeholder="symbolPlaceholder" :maxlength="10" :error="errors.symbol" />
        </div>
        <section class="network__section">
          <h3 class="network__heading md-title-small">Token</h3>
          <NetworkTokenList v-model="form.tokens" :network="form" />
        </section>
        <section v-if="!isTron" class="network__section">
          <h3 class="network__heading md-title-small">交易所</h3>
          <NetworkDexList v-model="form.dexes" :network="form" />
        </section>
      </form>
    </div>

    <template #footer>
      <MdButton v-if="!isNew" variant="text" color="error" @click="remove">删除</MdButton>
      <span class="network__spacer" />
      <MdButton variant="text" @click="emit('update:modelValue', false)">关闭</MdButton>
      <MdButton :loading="saving" @click="save">{{ isNew ? '添加' : '保存' }}</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.network {
  display: grid;
  grid-template-columns: 200px 1fr;
  gap: var(--md-space-4);
  min-height: 420px;
}

.network__list {
  display: flex;
  flex-direction: column;
  gap: 2px;
  padding: var(--md-space-2);
  background: var(--md-sys-color-surface-container);
  border-radius: var(--md-sys-shape-corner-medium);
  overflow-y: auto;
  max-height: 520px;
  align-self: flex-start;
}

.network__chain {
  color: var(--md-sys-color-on-surface-variant);
}

.network__form {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  min-width: 0;
  padding-top: var(--md-space-1);
}

.network__inline {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: var(--md-space-4);
}

.network__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.network__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.network__spacer {
  flex: 1;
}
</style>
