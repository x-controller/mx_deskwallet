import { computed } from 'vue'
import { useNetworkStore } from '@/stores/network'

/**
 * 顶栏：网络下拉选项、主区域模式、搜索占位，以及两个二级菜单的条目。
 * props 需要 mode 与各批量操作的 hint / disabled；菜单条目的 key 即顶栏 emit 的事件名
 */
export function useTopBar(props) {
  const networkStore = useNetworkStore()
  const networkOptions = computed(() => networkStore.networks.map((n) => ({ label: n.name, value: n.id })))
  const isHistory = computed(() => props.mode === 'history')
  const searchPlaceholder = computed(() => (isHistory.value ? '搜索哈希 / 地址 / 名称 / 币种' : '搜索名称 / 地址'))

  /** 「钱包」菜单：添加钱包的三种方式 */
  const walletMenu = computed(() => [
    { key: 'import', label: '导入私钥', hint: '每行一个私钥，可批量粘贴' },
    { key: 'create', label: '创建钱包', hint: '随机生成指定数量的新钱包' },
    { key: 'watch', label: '添加观察钱包', hint: '只存地址看余额，不含私钥' },
  ])

  /** 「批量操作」菜单：说明文字由父级按选中范围生成 */
  const batchMenu = computed(() => [
    { key: 'batch', label: '批量转账', hint: props.batchHint, disabled: props.batchDisabled },
    { key: 'collect', label: '聚合转账', hint: props.collectHint, disabled: props.collectDisabled },
    { key: 'swap', label: '兑换', hint: props.swapHint, disabled: props.swapDisabled },
    { key: 'drain', label: '一键清空', hint: props.drainHint, disabled: props.drainDisabled, danger: true },
  ])

  return { networkStore, networkOptions, isHistory, searchPlaceholder, walletMenu, batchMenu }
}
