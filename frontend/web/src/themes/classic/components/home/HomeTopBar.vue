<script setup>
import {
  RiAddLine,
  RiArrowLeftRightLine,
  RiCheckboxMultipleLine,
  RiEraserLine,
  RiEyeLine,
  RiFontSize,
  RiGitBranchLine,
  RiGitMergeLine,
  RiHistoryLine,
  RiKey2Line,
  RiLinksLine,
  RiLockLine,
  RiMoonLine,
  RiMore2Line,
  RiPaletteLine,
  RiRefreshLine,
  RiSearchLine,
  RiSettings3Line,
  RiSunLine,
  RiWallet3Line,
} from '@remixicon/vue'
import MxSelect from '@/themes/classic/components/MxSelect.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxMenu from '@/themes/classic/components/MxMenu.vue'
import MxTooltip from '@/themes/classic/components/MxTooltip.vue'
import { scheme, toggleScheme, setStyle } from '@/utils/theme'
import { useTopBar } from '@/composables/home/useTopBar'

const props = defineProps({
  keyword: { type: String, default: '' },
  refreshing: { type: Boolean, default: false },
  /** 主区域正在显示什么：wallets 钱包列表 | history 交易记录 */
  mode: { type: String, default: 'wallets' },
  /** 「批量操作」菜单各项的说明（由父级根据选中范围生成）与禁用态 */
  drainHint: { type: String, default: '' },
  drainDisabled: { type: Boolean, default: false },
  swapHint: { type: String, default: '' },
  swapDisabled: { type: Boolean, default: false },
  batchHint: { type: String, default: '' },
  batchDisabled: { type: Boolean, default: false },
  collectHint: { type: String, default: '' },
  collectDisabled: { type: Boolean, default: false },
  /** dApp 待处理请求数，大于 0 时按钮高亮 */
  dappPending: { type: Number, default: 0 },
})

const emit = defineEmits(['update:keyword', 'update:mode', 'import', 'create', 'watch', 'batch', 'collect', 'drain', 'swap', 'network', 'refresh', 'font', 'lock', 'dapp'])

const { networkStore, networkOptions, isHistory, searchPlaceholder, walletMenu, batchMenu } = useTopBar(props)

/** 菜单条目 key → 图标 */
const ICONS = {
  import: RiKey2Line,
  create: RiAddLine,
  watch: RiEyeLine,
  batch: RiGitBranchLine,
  collect: RiGitMergeLine,
  swap: RiArrowLeftRightLine,
  drain: RiEraserLine,
  font: RiFontSize,
  scheme: RiSunLine,
  style: RiPaletteLine,
}

/** 「更多」菜单：外观相关，只在经典风格里有 */
const moreMenu = [
  { key: 'font', label: '字体', hint: '预设或自定义字体栈' },
  { key: 'scheme', label: '深浅色', hint: '切换浅色 / 深色主题' },
  { key: 'style', label: '切换到 Material 3 风格', hint: '动态配色、Roboto、Material Symbols' },
]

function onMore(key) {
  if (key === 'font') emit('font')
  else if (key === 'scheme') toggleScheme()
  else if (key === 'style') setStyle('material')
}
</script>

<template>
  <header class="top-bar">
    <MxSelect
      class="top-bar__network"
      size="sm"
      :model-value="networkStore.activeNetworkId"
      :options="networkOptions"
      placeholder="选择网络"
      @update:model-value="networkStore.setActive($event)"
    />
    <MxTooltip content="配置 RPC">
      <MxButton icon size="sm" aria-label="配置 RPC" @click="emit('network')"><RiSettings3Line size="16" /></MxButton>
    </MxTooltip>

    <MxInput class="top-bar__search" size="sm" :model-value="keyword" :placeholder="searchPlaceholder" @update:model-value="emit('update:keyword', $event)">
      <template #prefix><RiSearchLine size="14" /></template>
    </MxInput>

    <div class="top-bar__actions">
      <MxMenu label="添加钱包" :items="walletMenu" @select="emit($event)">
        <RiAddLine size="18" />
        <template #icon="{ item }"><component :is="ICONS[item.key]" size="14" /></template>
      </MxMenu>
      <MxMenu label="批量操作" :items="batchMenu" @select="emit($event)">
        <RiCheckboxMultipleLine size="16" />
        <template #icon="{ item }"><component :is="ICONS[item.key]" size="14" /></template>
      </MxMenu>
      <MxTooltip :content="dappPending ? `dApp 连接 · ${dappPending} 个待处理请求` : 'dApp 连接（WalletConnect）'">
        <MxButton icon size="sm" :type="dappPending ? 'primary' : 'default'" aria-label="dApp 连接" @click="emit('dapp')"><RiLinksLine size="16" /></MxButton>
      </MxTooltip>
      <span class="top-bar__divider" />
      <MxTooltip :content="isHistory ? '返回钱包列表' : '交易记录'">
        <MxButton icon size="sm" :type="isHistory ? 'primary' : 'default'" :aria-label="isHistory ? '返回钱包列表' : '交易记录'" @click="emit('update:mode', isHistory ? 'wallets' : 'history')">
          <RiWallet3Line v-if="isHistory" size="16" />
          <RiHistoryLine v-else size="16" />
        </MxButton>
      </MxTooltip>
      <MxTooltip :content="isHistory ? '刷新交易状态' : '刷新余额'">
        <MxButton icon size="sm" :aria-label="isHistory ? '刷新交易状态' : '刷新余额'" :loading="refreshing" @click="emit('refresh')"><RiRefreshLine size="16" /></MxButton>
      </MxTooltip>
      <MxMenu label="更多" :items="moreMenu" @select="onMore">
        <RiMore2Line size="16" />
        <template #icon="{ item }">
          <RiMoonLine v-if="item.key === 'scheme' && scheme !== 'dark'" size="14" />
          <component :is="ICONS[item.key]" v-else size="14" />
        </template>
      </MxMenu>
      <MxTooltip content="锁定">
        <MxButton icon size="sm" aria-label="锁定" @click="emit('lock')"><RiLockLine size="16" /></MxButton>
      </MxTooltip>
    </div>
  </header>
</template>

<style scoped>
.top-bar {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  padding: var(--mx-space-xs);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
}

.top-bar__network {
  width: 150px;
}

.top-bar__search {
  flex: 1;
  max-width: 320px;
  margin-left: var(--mx-space-xs);
}

.top-bar__actions {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  margin-left: auto;
}

.top-bar__divider {
  width: 1px;
  height: var(--mx-space-md);
  margin: 0 var(--mx-space-xs);
  background: var(--mx-color-border);
}
</style>
