<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdSwitch from '@/themes/material/components/MdSwitch.vue'
import MdSkeleton from '@/themes/material/components/MdSkeleton.vue'
import WalletProgressList from '@/themes/material/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/material/components/wallet/WalletLogPanel.vue'
import { useCollectTask } from '@/composables/wallet/useCollectTask'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
  /** 要转出的钱包列表 */
  wallets: { type: Array, default: () => [] },
  network: { type: Object, default: null },
})

const emit = defineEmits(['update:modelValue', 'done'])

const {
  to, assetKey, amount, allMode, errors, running, finished, locked,
  asset, assetOptions, balanceLoading, summary, totalText, shortCount, progress, logs, canStart, start,
} = useCollectTask(props, emit)
</script>

<template>
  <MdDialog :model-value="modelValue" :title="`聚合转账 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`" icon="call_merge" width="720px" :closable="!running" @update:model-value="emit('update:modelValue', $event)">
    <div v-if="network" class="collect">
      <MdTextField v-model="to" dense label="接收地址" placeholder="0x..." :error="errors.to" :disabled="locked" autofocus mono />

      <MdSelect v-model="assetKey" dense label="资产" :options="assetOptions" :disabled="locked">
        <template #option="{ option }">
          <span class="collect__option">
            <span>{{ option.label }}</span>
            <MdSkeleton v-if="balanceLoading" width="60px" />
            <span v-else class="collect__option-balance md-body-small">合计 {{ option.balance }}</span>
          </span>
        </template>
      </MdSelect>
      <p class="collect__hint md-body-small">
        <MdSkeleton v-if="balanceLoading" width="160px" />
        <template v-else>
          <span>{{ wallets.length }} 个钱包合计 {{ totalText }} {{ asset?.symbol }}，{{ summary.holders }} 个有余额</span>
          <span v-if="summary.unknown" class="md-error-text">，{{ summary.unknown }} 个余额查询失败</span>
        </template>
      </p>

      <div class="collect__amount">
        <MdTextField
          v-model="amount"
          dense
          label="每个钱包转出"
          :placeholder="allMode ? '全部余额' : '0.0'"
          :error="errors.amount"
          :disabled="locked || allMode"
          :supporting-text="allMode ? `每个钱包把该资产全部转出${asset?.native ? '，原生币扣除手续费后转出' : ''}；余额为 0 的钱包跳过` : '每个钱包各转出该数量，余额不足的钱包会失败'"
          class="collect__amount-input"
        >
          <template #trailing><span class="md-body-small md-on-surface-variant">{{ asset?.symbol }}</span></template>
        </MdTextField>
        <MdSwitch v-model="allMode" :disabled="locked" class="collect__switch">全部余额</MdSwitch>
      </div>
      <p v-if="!allMode && shortCount" class="collect__hint md-body-small md-error-text">{{ shortCount }} 个钱包当前余额不足该数量</p>

      <section class="collect__section">
        <h3 class="collect__heading md-title-small">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" />
      </section>

      <section v-if="logs.length" class="collect__section">
        <h3 class="collect__heading md-title-small">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MdButton variant="text" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MdButton>
      <MdButton v-if="!finished" :disabled="!canStart" :loading="running" @click="start">开始转账</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.collect {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  padding-top: var(--md-space-1);
}

.collect__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--md-space-4);
  width: 100%;
}

.collect__option-balance {
  color: var(--md-sys-color-on-surface-variant);
}

.collect__hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: calc(var(--md-space-2) * -1) 0 0 var(--md-space-4);
  color: var(--md-sys-color-on-surface-variant);
}

.collect__amount {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-4);
}

.collect__amount-input {
  flex: 1;
}

.collect__switch {
  height: var(--md-comp-text-field-height-dense);
  flex-shrink: 0;
}

.collect__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
}

.collect__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}
</style>
