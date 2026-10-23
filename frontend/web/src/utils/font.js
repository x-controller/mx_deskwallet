import { ref } from 'vue'

const STORAGE_KEY = 'mx-font'
const VAR = '--mx-font-family'

/** 空字符串表示沿用 tokens.css 里的默认等宽字体栈 */
export const fontFamily = ref('')

export const FONT_PRESETS = [
  { label: '等宽（默认）', value: '' },
  { label: '系统默认', value: 'system-ui, "Microsoft YaHei", sans-serif', probe: '' },
  { label: 'Cascadia Mono', value: '"Cascadia Mono", monospace' },
  { label: 'Consolas', value: 'Consolas, monospace' },
  { label: 'JetBrains Mono', value: '"JetBrains Mono", monospace' },
  { label: 'Fira Code', value: '"Fira Code", monospace' },
  { label: 'Source Code Pro', value: '"Source Code Pro", monospace' },
  { label: 'Sarasa Mono SC（更纱黑体）', value: '"Sarasa Mono SC", monospace' },
  { label: 'Maple Mono', value: '"Maple Mono", monospace' },
  { label: '微软雅黑', value: '"Microsoft YaHei", sans-serif' },
  { label: '思源黑体', value: '"Source Han Sans SC", "Noto Sans CJK SC", sans-serif' },
]

function apply(value) {
  fontFamily.value = value
  const root = document.documentElement
  if (value) root.style.setProperty(VAR, value)
  else root.style.removeProperty(VAR)
}

export function initFont() {
  apply(localStorage.getItem(STORAGE_KEY) || '')
}

export function setFont(value) {
  const v = value.trim()
  if (v) localStorage.setItem(STORAGE_KEY, v)
  else localStorage.removeItem(STORAGE_KEY)
  apply(v)
}

/**
 * 判断字体是否已安装：用 canvas 分别以「候选字体 + 回退」和「仅回退」测宽，
 * 宽度不同说明候选字体生效。通用字族（monospace / sans-serif / system-ui）视为始终可用
 */
const probeCanvas = document.createElement('canvas').getContext('2d')
const PROBE_TEXT = 'mmmmmmmmmmlli0O1 钱包地址'

export function isFontInstalled(name) {
  const family = name.trim().replace(/^["']|["']$/g, '')
  if (!family || /^(monospace|sans-serif|serif|system-ui|ui-monospace)$/i.test(family)) return true
  const widthWith = (stack) => {
    probeCanvas.font = `16px ${stack}`
    return probeCanvas.measureText(PROBE_TEXT).width
  }
  return ['monospace', 'sans-serif'].some((fallback) => widthWith(`"${family}", ${fallback}`) !== widthWith(fallback))
}

/** 字体栈里第一个具体字体是否可用（空栈 / 全是通用字族视为可用） */
export function isStackAvailable(stack) {
  const first = stack.split(',')[0] ?? ''
  return isFontInstalled(first)
}
