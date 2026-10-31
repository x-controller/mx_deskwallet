/**
 * 正在发送交易的操作：安装更新会退出进程，批量转账 / 清空 / 兑换做到一半不能被打断。
 * 各弹框的进行中状态放在组件里，这里只统计还有几个没结束。
 */
import { onScopeDispose, watch } from 'vue'

let count = 0

export const txBusy = () => count > 0

/** 跟踪一个「进行中」的 ref，在组件 setup 里调用 */
export function trackBusy(flag) {
  watch(flag, (v) => { count += v ? 1 : -1 })
  onScopeDispose(() => { if (flag.value) count-- })
}
