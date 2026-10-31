import { computed } from 'vue'
import { useNetworkStore } from '@/stores/network'

/** 顶栏：网络下拉选项、主区域模式、搜索占位。props 需要 mode */
export function useTopBar(props) {
  const networkStore = useNetworkStore()
  const networkOptions = computed(() => networkStore.networks.map((n) => ({ label: n.name, value: n.id })))
  const isHistory = computed(() => props.mode === 'history')
  const searchPlaceholder = computed(() => (isHistory.value ? '搜索哈希 / 地址 / 名称 / 币种' : '搜索名称 / 地址'))
  return { networkStore, networkOptions, isHistory, searchPlaceholder }
}
