import { reactive } from 'vue'

/** 全局确认框状态，由 App 根部的 MxConfirm 统一渲染 */
export const confirmState = reactive({
  visible: false,
  title: '',
  content: '',
  confirmText: '确定',
  danger: false,
  resolve: null,
})

/**
 * 破坏性操作二次确认，返回 Promise<boolean>
 */
export function confirm({ title = '确认操作', content = '', confirmText = '确定', danger = true } = {}) {
  return new Promise((resolve) => {
    Object.assign(confirmState, { visible: true, title, content, confirmText, danger, resolve })
  })
}

export function settleConfirm(result) {
  confirmState.visible = false
  confirmState.resolve?.(result)
  confirmState.resolve = null
}
