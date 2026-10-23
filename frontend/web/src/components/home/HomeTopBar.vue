<script setup>
import { computed } from 'vue'
import {
  RiAddLine,
  RiEraserLine,
  RiFontSize,
  RiKey2Line,
  RiLockLine,
  RiMoonLine,
  RiRefreshLine,
  RiSearchLine,
  RiSettings3Line,
  RiSunLine,
} from '@remixicon/vue'
import MxSelect from '@/components/MxSelect.vue'
import MxInput from '@/components/MxInput.vue'
import MxButton from '@/components/MxButton.vue'
import MxTooltip from '@/components/MxTooltip.vue'
import { useNetworkStore } from '@/stores/network'
import { theme, toggleTheme } from '@/utils/theme'

defineProps({
  keyword: { type: String, default: '' },
  refreshing: { type: Boolean, default: false },
  /** 清空按钮的 tooltip 文案（由父级根据选中数量生成） */
  drainHint: { type: String, default: '一键清空' },
  drainDisabled: { type: Boolean, default: false },
})

const emit = defineEmits(['update:keyword', 'import', 'create', 'drain', 'network', 'refresh', 'font', 'lock'])

const networkStore = useNetworkStore()
const networkOptions = computed(() => networkStore.networks.map((n) => ({ label: n.name, value: n.id })))
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

    <MxInput class="top-bar__search" size="sm" :model-value="keyword" placeholder="搜索名称 / 地址" @update:model-value="emit('update:keyword', $event)">
      <template #prefix><RiSearchLine size="14" /></template>
    </MxInput>

    <div class="top-bar__actions">
      <MxTooltip content="导入私钥">
        <MxButton icon size="sm" aria-label="导入私钥" @click="emit('import')"><RiKey2Line size="16" /></MxButton>
      </MxTooltip>
      <MxTooltip content="创建钱包">
        <MxButton icon size="sm" aria-label="创建钱包" @click="emit('create')"><RiAddLine size="18" /></MxButton>
      </MxTooltip>
      <MxTooltip :content="drainHint">
        <MxButton icon size="sm" type="danger" aria-label="一键清空" :disabled="drainDisabled" @click="emit('drain')"><RiEraserLine size="16" /></MxButton>
      </MxTooltip>
      <span class="top-bar__divider" />
      <MxTooltip content="刷新余额">
        <MxButton icon size="sm" aria-label="刷新余额" :loading="refreshing" @click="emit('refresh')"><RiRefreshLine size="16" /></MxButton>
      </MxTooltip>
      <MxTooltip content="字体">
        <MxButton icon size="sm" aria-label="字体" @click="emit('font')"><RiFontSize size="16" /></MxButton>
      </MxTooltip>
      <MxTooltip :content="theme === 'dark' ? '浅色主题' : '深色主题'">
        <MxButton icon size="sm" aria-label="切换主题" @click="toggleTheme">
          <RiSunLine v-if="theme === 'dark'" size="16" />
          <RiMoonLine v-else size="16" />
        </MxButton>
      </MxTooltip>
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
