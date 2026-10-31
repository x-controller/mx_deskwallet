<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import DrainAssetList from './DrainAssetList.vue'
import WalletProgressList from '@/themes/classic/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/classic/components/wallet/WalletLogPanel.vue'
import { useDrainTask } from '@/composables/wallet/useDrainTask'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 要清空的钱包列表 */
  wallets: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const { to, errors, checked, totals, progress, logs, running, finished, assets, canStart, toggle, start } = useDrainTask(props, emit)
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`一键清空 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`"
    width="680px"
    :closable="!running"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div class="drain">
      <MxInput v-model="to" size="sm" placeholder="接收地址 0x..." :error="errors.to" :disabled="running || finished" autofocus />

      <section class="drain__section">
        <h3 class="drain__heading">清空哪些资产</h3>
        <DrainAssetList :assets="assets" :totals="totals" :checked="checked" :disabled="running || finished" @toggle="toggle" />
      </section>

      <section class="drain__section">
        <h3 class="drain__heading">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" />
      </section>

      <section v-if="logs.length" class="drain__section">
        <h3 class="drain__heading">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MxButton>
      <MxButton v-if="!finished" size="sm" type="danger" :disabled="!canStart" :loading="running" @click="start">开始清空</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.drain {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-md);
}

.drain__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.drain__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}
</style>
