<script setup>
import { RiAddLine, RiRadarLine } from '@remixicon/vue'
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import MxTag from '@/themes/classic/components/MxTag.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
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
  <MxDialog :model-value="modelValue" title="配置 RPC" width="760px" @update:model-value="emit('update:modelValue', $event)">
    <div class="network">
      <aside class="network__list">
        <button
          v-for="n in networkStore.networks"
          :key="n.id"
          class="network-item"
          :class="{ 'is-active': selectedId === n.id }"
          @click="select(n.id)"
        >
          <span class="network-item__name">{{ n.name }}</span>
          <MxTag v-if="n.id === networkStore.activeNetworkId" type="info">当前</MxTag>
          <span v-else class="network-item__chain">{{ n.type === 'tron' ? 'Tron' : n.chainId }}</span>
        </button>
        <button class="network-item" :class="{ 'is-active': isNew }" @click="createNew">
          <RiAddLine size="14" />
          <span class="network-item__name">新增网络</span>
        </button>
      </aside>

      <form class="network__form" @submit.prevent="save">
        <label class="network__row">
          <span class="network__label">链类型</span>
          <MxSelect v-model="form.type" size="sm" :options="typeOptions" :disabled="!isNew" class="network__field" />
        </label>
        <label class="network__row">
          <span class="network__label">名称</span>
          <MxInput v-model="form.name" size="sm" placeholder="如 Ethereum" :error="errors.name" class="network__field" />
        </label>
        <label class="network__row">
          <span class="network__label">{{ isTron ? '节点' : 'RPC' }}</span>
          <div class="network__field network__rpc">
            <MxInput v-model="form.rpcUrl" size="sm" :placeholder="rpcPlaceholder" :error="errors.rpcUrl" class="network__rpc-input" />
            <MxTooltip :content="detectHint">
              <MxButton icon size="sm" aria-label="检测 RPC" :loading="detecting" @click="detect"><RiRadarLine size="16" /></MxButton>
            </MxTooltip>
          </div>
        </label>
        <label v-if="isTron" class="network__row">
          <span class="network__label">API Key</span>
          <MxInput v-model="form.apiKey" size="sm" placeholder="TronGrid API Key（可选，不填受公共限流）" class="network__field" />
        </label>
        <div class="network__row network__row--inline">
          <label v-if="!isTron" class="network__row network__half">
            <span class="network__label">Chain ID</span>
            <MxInput v-model="form.chainId" size="sm" type="number" :error="errors.chainId" class="network__field" />
          </label>
          <label class="network__row network__half">
            <span class="network__label">符号</span>
            <MxInput v-model="form.symbol" size="sm" :placeholder="symbolPlaceholder" :maxlength="10" :error="errors.symbol" class="network__field" />
          </label>
        </div>
        <div class="network__row">
          <span class="network__label">Token</span>
          <NetworkTokenList v-model="form.tokens" :network="form" class="network__field" />
        </div>
        <div v-if="!isTron" class="network__row">
          <span class="network__label">交易所</span>
          <NetworkDexList v-model="form.dexes" :network="form" class="network__field" />
        </div>
      </form>
    </div>

    <template #footer>
      <MxButton v-if="!isNew" size="sm" type="danger" @click="remove">删除</MxButton>
      <span class="network__spacer" />
      <MxButton size="sm" @click="emit('update:modelValue', false)">关闭</MxButton>
      <MxButton size="sm" type="primary" :loading="saving" @click="save">{{ isNew ? '添加' : '保存' }}</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.network {
  display: grid;
  grid-template-columns: 180px 1fr;
  gap: var(--mx-space-sm);
  min-height: 360px;
}

.network__list {
  display: flex;
  flex-direction: column;
  padding: var(--mx-space-xs);
  background: var(--mx-color-bg);
  border-radius: var(--mx-radius-md);
  overflow-y: auto;
  max-height: 440px;
}

.network-item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  height: var(--mx-size-sm);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border: none;
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-surface);
  text-align: left;
  cursor: pointer;
  transition: background var(--mx-transition);
}

.network-item:hover {
  background: var(--mx-color-bg-hover);
}

.network-item.is-active {
  background: var(--mx-color-bg-active);
}

.network-item__name {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.network-item__chain {
  font-size: var(--mx-font-xs);
  color: var(--mx-color-text-secondary);
}

.network__form {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.network__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
}

.network__row--inline {
  gap: var(--mx-space-md);
}

.network__half {
  flex: 1;
}

.network__label {
  width: 56px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

/* 同一行的第二栏（符号）标签自适应，第一栏（Chain ID）仍占标签列，输入框与上下行左对齐 */
.network__half + .network__half .network__label {
  width: auto;
}

.network__field {
  flex: 1;
  min-width: 0;
}

.network__rpc {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
}

.network__rpc-input {
  flex: 1;
}

.network__spacer {
  flex: 1;
}
</style>
