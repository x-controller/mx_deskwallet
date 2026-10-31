<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import DrainAssetList from './DrainAssetList.vue'
import WalletProgressList from '@/themes/material/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/material/components/wallet/WalletLogPanel.vue'
import { useDrainTask } from '@/composables/wallet/useDrainTask'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 要清空的钱包列表 */
  wallets: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { to, errors, checked, totals, progress, logs, running, finished, locked, assets, canStart, toggle, start, toPlaceholder } = useDrainTask(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" :title="`一键清空 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`" width="720px" :closable="!running" @update:model-value="emit('update:modelValue', $event)">
    <div class="drain">
      <MdTextField v-model="to" dense label="接收地址" :placeholder="toPlaceholder" :error="errors.to" :disabled="locked" autofocus mono />

      <section class="drain__section">
        <h3 class="drain__heading md-title-small">清空哪些资产</h3>
        <DrainAssetList :assets="assets" :totals="totals" :checked="checked" :disabled="locked" @toggle="toggle" />
      </section>

      <section class="drain__section">
        <h3 class="drain__heading md-title-small">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" :network="network" />
      </section>

      <section v-if="logs.length" class="drain__section">
        <h3 class="drain__heading md-title-small">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MdButton>
      <MdButton v-if="!finished" color="error" :disabled="!canStart" :loading="running" @click="start">开始清空</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.drain {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
  padding-top: var(--md-space-1);
}

.drain__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.drain__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}
</style>
