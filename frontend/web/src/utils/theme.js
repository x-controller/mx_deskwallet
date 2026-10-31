import { ref } from 'vue'

/**
 * 主题分两个维度：
 * - style：界面风格，classic（经典）| material（Material 3），两套独立的组件 / 页面 / 样式，切换时整棵界面树重挂
 * - scheme：配色，light | dark，只改各风格自己的颜色 token
 * 两者都写到 <html> 的 data-style / data-theme 属性上，各风格的全局样式按属性隔离
 */
const STYLE_KEY = 'mx-style'
const SCHEME_KEY = 'mx-theme'

export const STYLES = [
  { value: 'classic', label: '经典' },
  { value: 'material', label: 'Material 3' },
]

export const style = ref('classic')
export const scheme = ref('light')

function applyStyle(value) {
  style.value = STYLES.some((s) => s.value === value) ? value : 'classic'
  document.documentElement.setAttribute('data-style', style.value)
}

function applyScheme(value) {
  scheme.value = value === 'dark' ? 'dark' : 'light'
  document.documentElement.setAttribute('data-theme', scheme.value)
}

export function initTheme() {
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  applyStyle(localStorage.getItem(STYLE_KEY) || 'classic')
  applyScheme(localStorage.getItem(SCHEME_KEY) || (prefersDark ? 'dark' : 'light'))
}

export function setStyle(value) {
  localStorage.setItem(STYLE_KEY, value)
  applyStyle(value)
}

export function setScheme(value) {
  localStorage.setItem(SCHEME_KEY, value)
  applyScheme(value)
}

export function toggleScheme() {
  setScheme(scheme.value === 'dark' ? 'light' : 'dark')
}
