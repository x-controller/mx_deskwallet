import { reactive } from 'vue'

/** 全局消息队列，由 App 根部的 MxMessage 统一渲染 */
export const messages = reactive([])

let seed = 0
const DURATION = 2600

function push(type, text) {
  const id = ++seed
  messages.push({ id, type, text })
  setTimeout(() => {
    const i = messages.findIndex((m) => m.id === id)
    if (i >= 0) messages.splice(i, 1)
  }, DURATION)
}

export const message = {
  success: (text) => push('success', text),
  error: (text) => push('error', text),
  info: (text) => push('info', text),
}
