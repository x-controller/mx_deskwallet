import { defineStore } from 'pinia'
import { computed, ref } from 'vue'
import { appVersion, onUpdateProgress, updateCheck, updateDownload, updateInstall } from '@/utils/update'
import { txBusy } from '@/utils/busy'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'

const WAIT_MS = 500

/** 新版本检查与安装：发现新版本只在状态栏提示，由用户点击后才更新 */
export const useUpdateStore = defineStore('update', () => {
  const version = ref('')
  /** 发现的新版本 { version, notes } */
  const available = ref(null)
  const checking = ref(false)
  /** '' | 'downloading' | 'waiting'（下载完，等交易发送结束）| 'installing' */
  const phase = ref('')
  /** 下载百分比，还没收到进度时为 null */
  const percent = ref(null)
  const statusText = computed(() => ({
    downloading: percent.value === null ? '正在下载更新…' : `正在下载更新… ${percent.value}%`,
    waiting: '交易发送结束后开始更新…',
    installing: '正在安装更新…',
  })[phase.value] ?? '')

  async function init() {
    version.value = await appVersion()
  }

  /** 查一次，返回新版本或 null */
  async function check() {
    checking.value = true
    try {
      available.value = await updateCheck()
      return available.value
    } finally {
      checking.value = false
    }
  }

  async function install() {
    if (phase.value || !available.value) return
    const { version: next, notes } = available.value
    const ok = await confirm({
      title: `更新到 v${next}`,
      content: `${notes ? `${notes}\n\n` : ''}正在发送的交易结束后才会安装。安装时 Portunus 会短暂关闭，完成后自动重新打开，需要重新输入口令解锁。`,
      confirmText: '立即更新',
      danger: false,
    })
    if (!ok) return
    let unlisten = () => {}
    try {
      phase.value = 'downloading'
      unlisten = await onUpdateProgress((p) => { percent.value = p })
      await updateDownload()
      phase.value = 'waiting'
      while (txBusy()) await new Promise((r) => setTimeout(r, WAIT_MS))
      phase.value = 'installing'
      await updateInstall()
    } catch (e) {
      message.error(e?.message || String(e))
    } finally {
      unlisten()
      phase.value = ''
      percent.value = null
    }
  }

  return { version, available, checking, phase, statusText, init, check, install }
})
