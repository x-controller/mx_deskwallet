<script setup>
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdProgress from '@/themes/material/components/MdProgress.vue'
import DappSessionList from './DappSessionList.vue'
import { useDappDialog } from '@/composables/dapp/useDappDialog'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { dapp, projectIdDraft, savingProject, uri, uriError, pairing, disconnecting, editingProject, networkNames, saveProject, pair, disconnect, retryInit } = useDappDialog(props)
</script>

<template>
  <MdDialog :model-value="modelValue" title="dApp 连接 · WalletConnect" icon="link" width="640px" @update:model-value="emit('update:modelValue', $event)">
    <div class="dapp">
      <section v-if="editingProject" class="dapp__section">
        <h3 class="dapp__heading md-title-small">Project ID</h3>
        <p class="dapp__hint md-body-small">WalletConnect 需要一个免费的 Reown Cloud Project ID（cloud.reown.com 注册后创建项目即可），只保存在本机金库里。</p>
        <div class="dapp__row">
          <MdTextField v-model="projectIdDraft" dense label="Project ID" placeholder="32 位十六进制" :maxlength="64" class="dapp__grow" mono @enter="saveProject" />
          <MdButton :loading="savingProject" @click="saveProject">保存并启用</MdButton>
          <MdButton v-if="dapp.projectId" variant="text" @click="editingProject = false">取消</MdButton>
        </div>
      </section>

      <template v-else>
        <div class="dapp__status md-body-small">
          <template v-if="dapp.status === 'initializing'"><MdProgress :size="16" /> 正在连接中继…</template>
          <template v-else-if="dapp.status === 'error'"><MdIcon name="error" :size="18" class="md-error-text" /><span class="md-error-text">初始化失败：{{ dapp.error }}</span></template>
          <template v-else-if="dapp.ready"><MdIcon name="check_circle" :size="18" class="dapp__ok" /> WalletConnect 已就绪</template>
          <template v-else>未初始化</template>
          <span class="dapp__status-actions">
            <MdButton v-if="dapp.status === 'error'" variant="text" dense @click="retryInit">重试</MdButton>
            <MdButton variant="text" dense @click="editingProject = true">更换 Project ID</MdButton>
          </span>
        </div>

        <section class="dapp__section">
          <h3 class="dapp__heading md-title-small">连接 dApp</h3>
          <div class="dapp__row">
            <MdTextField v-model="uri" dense label="连接串" placeholder="wc:…（dApp 选择 WalletConnect 后点「复制链接」）" :error="uriError" :disabled="!dapp.ready" class="dapp__grow" mono @enter="pair">
              <template #leading><MdIcon name="link" :size="20" /></template>
            </MdTextField>
            <MdButton :disabled="!dapp.ready || !uri.trim()" :loading="pairing" @click="pair">连接</MdButton>
          </div>
        </section>

        <section class="dapp__section">
          <h3 class="dapp__heading md-title-small">已连接（{{ dapp.sessions.length }}）</h3>
          <DappSessionList :sessions="dapp.sessions" :network-names="networkNames" :disconnecting="disconnecting" @disconnect="disconnect" />
        </section>
      </template>
    </div>

    <template #footer>
      <MdButton variant="text" @click="emit('update:modelValue', false)">关闭</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.dapp {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-5);
  padding-top: var(--md-space-1);
}

.dapp__section {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-3);
}

.dapp__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.dapp__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.dapp__row {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-2);
}

.dapp__grow {
  flex: 1;
}

.dapp__status {
  display: flex;
  align-items: center;
  gap: var(--md-space-2);
  min-height: 44px;
  padding: 0 var(--md-space-2) 0 var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
  color: var(--md-sys-color-on-surface-variant);
}

.dapp__ok {
  color: var(--md-sys-color-success);
}

.dapp__status-actions {
  display: inline-flex;
  margin-left: auto;
}
</style>
