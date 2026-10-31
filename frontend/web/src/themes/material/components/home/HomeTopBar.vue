<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdIconButton from '@/themes/material/components/MdIconButton.vue'
import MdSelect from '@/themes/material/components/MdSelect.vue'
import MdSearchBar from '@/themes/material/components/MdSearchBar.vue'
import MdSegmentedButton from '@/themes/material/components/MdSegmentedButton.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { useTopBar } from '@/composables/home/useTopBar'

const props = defineProps({
  keyword: { type: String, default: '' },
  refreshing: { type: Boolean, default: false },
  /** 主区域正在显示什么：wallets 钱包列表 | history 交易记录 */
  mode: { type: String, default: 'wallets' },
  /** 清空按钮的 tooltip 文案（由父级根据选中数量生成） */
  drainHint: { type: String, default: '一键清空' },
  drainDisabled: { type: Boolean, default: false },
  /** 兑换按钮的 tooltip 文案 */
  swapHint: { type: String, default: '兑换' },
  swapDisabled: { type: Boolean, default: false },
  /** dApp 待处理请求数，大于 0 时按钮高亮 */
  dappPending: { type: Number, default: 0 },
})

const emit = defineEmits(['update:keyword', 'update:mode', 'import', 'create', 'watch', 'drain', 'swap', 'network', 'refresh', 'appearance', 'lock', 'dapp'])

const { networkStore, networkOptions, isHistory, searchPlaceholder } = useTopBar(props)

const MODES = [
  { value: 'wallets', label: '钱包', icon: 'account_balance_wallet' },
  { value: 'history', label: '记录', icon: 'history' },
]
</script>

<template>
  <header class="top-bar">
    <span class="top-bar__brand">
      <span class="top-bar__logo"><MdIcon name="account_balance_wallet" :size="22" /></span>
      <span class="top-bar__title md-title-large">Portunus</span>
    </span>

    <MdSelect class="top-bar__network" dense label="网络" :model-value="networkStore.activeNetworkId" :options="networkOptions" placeholder="选择网络" @update:model-value="networkStore.setActive($event)" />
    <MdTooltip content="配置 RPC">
      <MdIconButton aria-label="配置 RPC" @click="emit('network')"><MdIcon name="settings" /></MdIconButton>
    </MdTooltip>

    <MdSearchBar class="top-bar__search" :model-value="keyword" :placeholder="searchPlaceholder" @update:model-value="emit('update:keyword', $event)" />

    <MdSegmentedButton class="top-bar__mode" :model-value="mode" :options="MODES" @update:model-value="emit('update:mode', $event)" />

    <div class="top-bar__actions">
      <MdTooltip content="导入私钥">
        <MdIconButton aria-label="导入私钥" @click="emit('import')"><MdIcon name="key" /></MdIconButton>
      </MdTooltip>
      <MdTooltip content="创建钱包">
        <MdIconButton variant="tonal" aria-label="创建钱包" @click="emit('create')"><MdIcon name="add" /></MdIconButton>
      </MdTooltip>
      <MdTooltip content="添加观察钱包（只看余额，不含私钥）">
        <MdIconButton aria-label="添加观察钱包" @click="emit('watch')"><MdIcon name="visibility" /></MdIconButton>
      </MdTooltip>
      <MdTooltip :content="swapHint">
        <MdIconButton aria-label="兑换" :disabled="swapDisabled" @click="emit('swap')"><MdIcon name="swap_horiz" /></MdIconButton>
      </MdTooltip>
      <MdTooltip :content="drainHint">
        <MdIconButton color="error" aria-label="一键清空" :disabled="drainDisabled" @click="emit('drain')"><MdIcon name="cleaning_services" /></MdIconButton>
      </MdTooltip>
      <MdTooltip :content="dappPending ? `dApp 连接 · ${dappPending} 个待处理请求` : 'dApp 连接（WalletConnect）'">
        <MdIconButton :variant="dappPending ? 'filled' : 'standard'" aria-label="dApp 连接" @click="emit('dapp')"><MdIcon name="link" /></MdIconButton>
      </MdTooltip>
      <span class="top-bar__divider" />
      <MdTooltip :content="isHistory ? '刷新交易状态' : '刷新余额'">
        <MdIconButton :aria-label="isHistory ? '刷新交易状态' : '刷新余额'" :loading="refreshing" @click="emit('refresh')"><MdIcon name="refresh" /></MdIconButton>
      </MdTooltip>
      <MdTooltip content="外观">
        <MdIconButton aria-label="外观" @click="emit('appearance')"><MdIcon name="palette" /></MdIconButton>
      </MdTooltip>
      <MdTooltip content="锁定">
        <MdIconButton aria-label="锁定" @click="emit('lock')"><MdIcon name="lock" /></MdIconButton>
      </MdTooltip>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  height: var(--md-comp-top-app-bar-height);
  padding: 0 var(--md-space-4);
  flex-shrink: 0;
}

.top-bar__brand {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-2);
  margin-right: var(--md-space-2);
}

.top-bar__logo {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-primary);
  color: var(--md-sys-color-on-primary);
}

.top-bar__title {
  color: var(--md-sys-color-on-surface);
}

.top-bar__network {
  width: 176px;
}

.top-bar__search {
  flex: 1;
  max-width: 340px;
  margin-left: var(--md-space-2);
}

.top-bar__mode {
  margin-left: var(--md-space-2);
}

.top-bar__actions {
  display: flex;
  align-items: center;
  gap: 0;
  margin-left: auto;
}

.top-bar__divider {
  width: 1px;
  height: var(--md-space-6);
  margin: 0 var(--md-space-2);
  background: var(--md-sys-color-outline-variant);
}
</style>
