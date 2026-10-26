<script setup>
import { computed, ref, watch } from 'vue'
import { RiLinkM } from '@remixicon/vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxButton from '@/components/MxButton.vue'
import MxSpinner from '@/components/MxSpinner.vue'
import DappSessionList from './DappSessionList.vue'
import { useDappStore } from '@/stores/dapp'
import { useNetworkStore } from '@/stores/network'
import { message } from '@/utils/message'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const dapp = useDappStore()
const networkStore = useNetworkStore()

const projectIdDraft = ref('')
const savingProject = ref(false)
const uri = ref('')
const uriError = ref('')
const pairing = ref(false)
const disconnecting = ref('')

const networkNames = computed(() => Object.fromEntries(networkStore.networks.map((n) => [n.chainId, n.name])))
const editingProject = ref(false)

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    projectIdDraft.value = dapp.projectId
    editingProject.value = !dapp.projectId
    uri.value = ''
    uriError.value = ''
  },
)

async function saveProject() {
  const id = projectIdDraft.value.trim()
  if (!/^[0-9a-f]{32}$/i.test(id)) {
    message.error('Project ID 应为 32 位十六进制')
    return
  }
  savingProject.value = true
  try {
    await dapp.setProjectId(id)
    await dapp.init()
    editingProject.value = false
    message.success('WalletConnect 已就绪')
  } catch (e) {
    message.error(`初始化失败：${e?.message || e}`)
  } finally {
    savingProject.value = false
  }
}

async function pair() {
  const u = uri.value.trim()
  uriError.value = ''
  if (!u.startsWith('wc:')) {
    uriError.value = '连接串应以 wc: 开头，请从 dApp 的 WalletConnect 二维码旁复制'
    return
  }
  pairing.value = true
  try {
    await dapp.pair(u)
    uri.value = ''
    message.success('已配对，等待 dApp 发来连接请求')
  } catch (e) {
    uriError.value = `配对失败：${e?.message || e}`
  } finally {
    pairing.value = false
  }
}

async function disconnect(topic) {
  disconnecting.value = topic
  try {
    await dapp.disconnect(topic)
    message.success('已断开')
  } catch (e) {
    message.error(`断开失败：${e?.message || e}`)
  } finally {
    disconnecting.value = ''
  }
}
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
            <MxButton v-if="dapp.status === 'error'" size="xs" @click="dapp.init().catch((e) => message.error(e?.message || String(e)))">重试</MxButton>
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
