import { ref } from 'vue'

const STORAGE_KEY = 'mx-theme'

export const theme = ref('light')

function apply(value) {
  theme.value = value
  if (value === 'dark') document.documentElement.setAttribute('data-theme', 'dark')
  else document.documentElement.removeAttribute('data-theme')
}

export function initTheme() {
  const saved = localStorage.getItem(STORAGE_KEY)
  const prefersDark = window.matchMedia?.('(prefers-color-scheme: dark)').matches
  apply(saved || (prefersDark ? 'dark' : 'light'))
}

export function toggleTheme() {
  const next = theme.value === 'dark' ? 'light' : 'dark'
  localStorage.setItem(STORAGE_KEY, next)
  apply(next)
}
