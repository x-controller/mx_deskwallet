import { computed, ref, watch } from 'vue'
import { useDappStore } from '@/stores/dapp'
import { useNetworkStore } from '@/stores/network'
import { message } from '@/utils/message'

/** dApp 连接弹框：Project ID 配置、wc: 配对、会话断开。props 需要 modelValue */
export function useDappDialog(props) {
  const dapp = useDappStore()
  const networkStore = useNetworkStore()

  const projectIdDraft = ref('')
  const savingProject = ref(false)
  const uri = ref('')
  const uriError = ref('')
  const pairing = ref(false)
  const disconnecting = ref('')
  const editingProject = ref(false)

  const networkNames = computed(() => Object.fromEntries(networkStore.evmNetworks.map((n) => [n.chainId, n.name])))

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

  function retryInit() {
    dapp.init().catch((e) => message.error(e?.message || String(e)))
  }

  return { dapp, projectIdDraft, savingProject, uri, uriError, pairing, disconnecting, editingProject, networkNames, saveProject, pair, disconnect, retryInit }
}
