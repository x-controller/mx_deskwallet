import { onBeforeUnmount, watch } from 'vue'

/**
 * 弹窗通用行为：关闭 / 遮罩点击 / Esc，两套主题的 Dialog 组件共用。
 * props 需要 modelValue、closable、maskClosable
 */
export function useDialog(props, emit) {
  function close() {
    if (!props.closable) return
    emit('update:modelValue', false)
    emit('close')
  }

  function onMask() {
    if (props.maskClosable) close()
  }

  function onKey(e) {
    if (e.key === 'Escape') close()
  }

  watch(
    () => props.modelValue,
    (v) => {
      if (v) document.addEventListener('keydown', onKey)
      else document.removeEventListener('keydown', onKey)
    },
    { immediate: true },
  )

  onBeforeUnmount(() => document.removeEventListener('keydown', onKey))

  return { close, onMask }
}
