import { ref } from 'vue'

/**
 * Material 3 动态配色：从一个种子色用 material-color-utilities 生成整套 tonal palette，
 * 浅 / 深两套 --md-sys-color-* 写进 <head> 的 style 标签，按 html[data-theme] 自动切换。
 * success / warning 是 M3 没有的语义色，按 custom color 规则与种子色调和后生成。
 */
const SEED_KEY = 'mx-m3-seed'
export const DEFAULT_SEED = '#6750A4'

export const SEED_PRESETS = [
  { label: 'Material 紫', value: '#6750A4' },
  { label: '靛蓝', value: '#3F51B5' },
  { label: '蓝', value: '#1E88E5' },
  { label: '青', value: '#00897B' },
  { label: '绿', value: '#43A047' },
  { label: '琥珀', value: '#FFB300' },
  { label: '橙', value: '#FB8C00' },
  { label: '红', value: '#E53935' },
  { label: '粉', value: '#D81B60' },
  { label: '蓝灰', value: '#607D8B' },
]

export const CUSTOM_ROLES = [
  { name: 'success', value: '#2E7D32', blend: true },
  { name: 'warning', value: '#EF6C00', blend: false }, /* 橙色向种子色调和会偏红，保持原色相 */
]

/** MaterialDynamicColors 里要导出成 CSS 变量的颜色角色 */
export const COLOR_ROLES = [
  'background', 'onBackground',
  'surface', 'surfaceDim', 'surfaceBright',
  'surfaceContainerLowest', 'surfaceContainerLow', 'surfaceContainer', 'surfaceContainerHigh', 'surfaceContainerHighest',
  'onSurface', 'surfaceVariant', 'onSurfaceVariant', 'inverseSurface', 'inverseOnSurface',
  'outline', 'outlineVariant', 'shadow', 'scrim', 'surfaceTint',
  'primary', 'onPrimary', 'primaryContainer', 'onPrimaryContainer', 'inversePrimary',
  'secondary', 'onSecondary', 'secondaryContainer', 'onSecondaryContainer',
  'tertiary', 'onTertiary', 'tertiaryContainer', 'onTertiaryContainer',
  'error', 'onError', 'errorContainer', 'onErrorContainer',
]

export const seedColor = ref(normalize(localStorage.getItem(SEED_KEY)) || DEFAULT_SEED)

function normalize(hex) {
  return /^#[0-9a-f]{6}$/i.test(hex || '') ? hex.toUpperCase() : ''
}

export const kebab = (s) => s.replace(/[A-Z]/g, (c) => `-${c.toLowerCase()}`)

/** 生成两套配色的 CSS 文本，node 脚本与运行时共用 */
export function buildColorCss(mcu, seed) {
  const { Hct, SchemeTonalSpot, MaterialDynamicColors, argbFromHex, hexFromArgb, customColor } = mcu
  const source = argbFromHex(seed)
  const block = (dark) => {
    const scheme = new SchemeTonalSpot(Hct.fromInt(source), dark, 0)
    const lines = COLOR_ROLES.map((role) => `  --md-sys-color-${kebab(role)}: ${hexFromArgb(MaterialDynamicColors[role].getArgb(scheme))};`)
    for (const { name, value, blend } of CUSTOM_ROLES) {
      const group = customColor(source, { name, value: argbFromHex(value), blend })[dark ? 'dark' : 'light']
      lines.push(
        `  --md-sys-color-${name}: ${hexFromArgb(group.color)};`,
        `  --md-sys-color-on-${name}: ${hexFromArgb(group.onColor)};`,
        `  --md-sys-color-${name}-container: ${hexFromArgb(group.colorContainer)};`,
        `  --md-sys-color-on-${name}-container: ${hexFromArgb(group.onColorContainer)};`,
      )
    }
    return `:root[data-style="material"][data-theme="${dark ? 'dark' : 'light'}"] {\n${lines.join('\n')}\n}`
  }
  return `${block(false)}\n\n${block(true)}\n`
}

let styleEl = null
let mcuPromise = null

export async function applyMaterialColors(seed = seedColor.value) {
  mcuPromise ||= import('@material/material-color-utilities')
  const css = buildColorCss(await mcuPromise, seed)
  if (!styleEl) {
    styleEl = document.createElement('style')
    styleEl.id = 'md-sys-color'
    document.head.appendChild(styleEl)
  }
  styleEl.textContent = css
}

export function setSeedColor(hex) {
  const v = normalize(hex)
  if (!v) return
  seedColor.value = v
  if (v === DEFAULT_SEED) localStorage.removeItem(SEED_KEY)
  else localStorage.setItem(SEED_KEY, v)
  return applyMaterialColors(v)
}
