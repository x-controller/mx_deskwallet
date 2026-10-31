<script setup>
import { RiLinkM } from '@remixicon/vue'
import MxDialog from '@/themes/classic/components/MxDialog.vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import MxSpinner from '@/themes/classic/components/MxSpinner.vue'
import DappSessionList from './DappSessionList.vue'
import { useDappDialog } from '@/composables/dapp/useDappDialog'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const { dapp, projectIdDraft, savingProject, uri, uriError, pairing, disconnecting, editingProject, networkNames, saveProject, pair, disconnect, retryInit } = useDappDialog(props)
</script>

<template>
  <MxDialog :model-value="modelValue" title="dApp 连接 · WalletConnect" width="640px" @update:model-value="emit('update:modelValue', $event)">
    <div class="dapp">
      <section v-if="editingProject" class="dapp__section">
        <h3 class="dapp__heading">Project ID</h3>
        <p class="dapp__hint">WalletConnect 需要一个免费的 Reown Cloud Project ID（cloud.reown.com 注册后创建项目即可），只保存在本机金库里。</p>
        <div class="dapp__row">
          <MxInput v-model="projectIdDraft" size="sm" placeholder="32 位 Project ID" :maxlength="64" class="dapp__grow" @enter="saveProject" />
          <MxButton size="sm" type="primary" :loading="savingProject" @click="saveProject">保存并启用</MxButton>
          <MxButton v-if="dapp.projectId" size="sm" @click="editingProject = false">取消</MxButton>
        </div>
      </section>

      <template v-else>
        <section class="dapp__section">
          <div class="dapp__status">
            <template v-if="dapp.status === 'initializing'"><MxSpinner :size="12" /> 正在连接中继…</template>
            <template v-else-if="dapp.status === 'error'"><span class="is-error">初始化失败：{{ dapp.error }}</span></template>
            <template v-else-if="dapp.ready">WalletConnect 已就绪</template>
            <template v-else>未初始化</template>
            <MxButton size="xs" class="dapp__edit" @click="editingProject = true">更换 Project ID</MxButton>
            <MxButton v-if="dapp.status === 'error'" size="xs" @click="retryInit">重试</MxButton>
          </div>
        </section>

        <section class="dapp__section">
          <h3 class="dapp__heading">连接 dApp</h3>
          <div class="dapp__row">
            <MxInput v-model="uri" size="sm" placeholder="粘贴 wc:… 连接串（dApp 选择 WalletConnect 后点「复制链接」）" :error="uriError" :disabled="!dapp.ready" class="dapp__grow" @enter="pair">
              <template #prefix><RiLinkM size="14" /></template>
            </MxInput>
            <MxButton size="sm" type="primary" :disabled="!dapp.ready || !uri.trim()" :loading="pairing" @click="pair">连接</MxButton>
          </div>
        </section>

        <section class="dapp__section">
          <h3 class="dapp__heading">已连接（{{ dapp.sessions.length }}）</h3>
          <DappSessionList :sessions="dapp.sessions" :network-names="networkNames" :disconnecting="disconnecting" @disconnect="disconnect" />
        </section>
      </template>
    </div>

    <template #footer>
      <MxButton size="sm" @click="emit('update:modelValue', false)">关闭</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.dapp {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-md);
}

.dapp__section {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
}

.dapp__heading {
  margin: 0;
  font-size: var(--mx-font-sm);
  font-weight: 500;
  color: var(--mx-color-text-secondary);
}

.dapp__hint {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
  line-height: 1.5;
}

.dapp__row {
  display: flex;
  align-items: flex-start;
  gap: var(--mx-space-xs);
}

.dapp__grow {
  flex: 1;
}

.dapp__status {
  display: flex;
  align-items: center;
  gap: var(--mx-space-xs);
  min-height: var(--mx-size-sm);
  padding: 0 var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.dapp__edit {
  margin-left: auto;
}

.is-error {
  color: var(--mx-color-danger);
}
</style>
