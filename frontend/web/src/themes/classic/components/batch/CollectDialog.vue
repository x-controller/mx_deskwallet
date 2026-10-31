<script setup>
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxCheckbox from '@/themes/classic/components/MxCheckbox.vue'
import MxSkeleton from '@/themes/classic/components/MxSkeleton.vue'
import WalletProgressList from '@/themes/classic/components/wallet/WalletProgressList.vue'
import WalletLogPanel from '@/themes/classic/components/wallet/WalletLogPanel.vue'
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
  asset, assetOptions, balanceLoading, summary, totalText, shortCount, progress, logs, canStart, start, toPlaceholder,
} = useCollectTask(props, emit)
</script>

<template>
  <MxDialog
    :model-value="modelValue"
    :title="`聚合转账 · ${wallets.length} 个钱包 · ${network?.name ?? ''}`"
    width="680px"
    :closable="!running"
    @update:model-value="emit('update:modelValue', $event)"
  >
    <div v-if="network" class="collect">
      <div class="collect__row">
        <span class="collect__label">接收</span>
        <div class="collect__field">
          <MxInput v-model="to" size="sm" :placeholder="`接收地址 ${toPlaceholder}`" :error="errors.to" :disabled="locked" autofocus />
        </div>
      </div>

      <div class="collect__row">
        <span class="collect__label">资产</span>
        <div class="collect__field">
          <MxSelect v-model="assetKey" size="sm" :options="assetOptions" :disabled="locked">
            <template #option="{ option }">
              <span class="collect__option">
                <span>{{ option.label }}</span>
                <MxSkeleton v-if="balanceLoading" width="60px" />
                <span v-else class="collect__option-balance">合计 {{ option.balance }}</span>
              </span>
            </template>
          </MxSelect>
          <p class="collect__hint">
            <MxSkeleton v-if="balanceLoading" width="160px" />
            <template v-else>
              <span>{{ wallets.length }} 个钱包合计 {{ totalText }} {{ asset?.symbol }}，{{ summary.holders }} 个有余额</span>
              <span v-if="summary.unknown" class="is-error">，{{ summary.unknown }} 个余额查询失败</span>
            </template>
          </p>
        </div>
      </div>

      <div class="collect__row">
        <span class="collect__label">数量</span>
        <div class="collect__field">
          <div class="collect__amount">
            <MxInput v-model="amount" size="sm" :placeholder="allMode ? '每个钱包的全部余额' : '0.0'" :error="errors.amount" :disabled="locked || allMode" class="collect__amount-input">
              <template #suffix><span class="collect__symbol">{{ asset?.symbol }}</span></template>
            </MxInput>
            <MxCheckbox v-model="allMode" :disabled="locked">全部余额</MxCheckbox>
          </div>
          <p class="collect__hint">
            <template v-if="allMode">每个钱包把该资产全部转出{{ asset?.native ? '，原生币扣除手续费后转出' : '' }}；余额为 0 的钱包跳过</template>
            <template v-else>每个钱包各转出该数量<span v-if="shortCount" class="is-error">，{{ shortCount }} 个钱包余额不足会失败</span></template>
          </p>
        </div>
      </div>

      <section class="collect__section">
        <h3 class="collect__heading">钱包进度</h3>
        <WalletProgressList :wallets="wallets" :progress="progress" :network="network" />
      </section>

      <section v-if="logs.length" class="collect__section">
        <h3 class="collect__heading">日志</h3>
        <WalletLogPanel :logs="logs" />
      </section>
    </div>

    <template #footer>
      <MxButton size="sm" :disabled="running" @click="emit('update:modelValue', false)">{{ finished ? '关闭' : '取消' }}</MxButton>
      <MxButton v-if="!finished" size="sm" type="primary" :disabled="!canStart" :loading="running" @click="start">开始转账</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.collect {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.collect__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
  min-height: var(--mx-size-sm);
}

.collect__label {
  width: 40px;
  flex-shrink: 0;
  line-height: var(--mx-size-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.collect__field {
  flex: 1;
  min-width: 0;
}

.collect__option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  gap: var(--mx-space-md);
  width: 100%;
}

.collect__option-balance,
.collect__symbol {
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.collect__amount {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-sm);
}

.collect__amount-input {
  flex: 1;
}

.collect__amount :deep(.mx-checkbox) {
  height: var(--mx-size-sm);
}

.collect__hint {
  display: flex;
  align-items: center;
  flex-wrap: wrap;
  margin: var(--mx-space-xs) 0 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.collect__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.collect__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
