import { computed, ref, watch } from 'vue'
import { FONT_PRESETS, fontFamily, isStackAvailable, setFont } from '@/utils/font'

export const FONT_SAMPLE = '0x19E7E3…DAff2A  钱包 1  12.3456 ETH'

/** 字体弹框：预设列表（标注是否已安装）与自定义字体栈。props 需要 modelValue */
export function useFontDialog(props) {
  const custom = ref('')

  /** 打开弹框时按已安装情况标注一次（canvas 测宽，不必每次渲染都算） */
  const presets = computed(() => FONT_PRESETS.map((p) => ({ ...p, installed: isStackAvailable(p.value) })))
  const isPreset = (value) => FONT_PRESETS.some((p) => p.value === value)

  watch(
    () => props.modelValue,
    (v) => {
      if (v) custom.value = isPreset(fontFamily.value) ? '' : fontFamily.value
    },
  )

  function choose(p) {
    if (!p.installed) return
    custom.value = ''
    setFont(p.value)
  }

  function applyCustom() {
    if (!custom.value.trim()) return
    setFont(custom.value)
  }

  return { custom, presets, fontFamily, choose, applyCustom, setFont }
}
