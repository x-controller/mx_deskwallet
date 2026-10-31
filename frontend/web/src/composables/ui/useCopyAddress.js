import { computed } from 'vue'
import { shortAddress } from '@/utils/format'
import { copyText } from '@/utils/storage'
import { message } from '@/utils/message'

/** 地址 / 哈希展示与复制。props 需要 address、head、tail、full、label */
export function useCopyAddress(props) {
  const text = computed(() => (props.full ? props.address : shortAddress(props.address, props.head, props.tail)))

  async function copy() {
    try {
      await copyText(props.address)
      message.success(`${props.label}已复制`)
    } catch {
      message.error('复制失败')
    }
  }

  return { text, copy }
}
