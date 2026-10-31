<script setup>
import { ref, watch } from 'vue'
import MdDialog from '@/themes/material/components/MdDialog.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import MdSegmentedButton from '@/themes/material/components/MdSegmentedButton.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdTooltip from '@/themes/material/components/MdTooltip.vue'
import { STYLES, style, scheme, setStyle, setScheme } from '@/utils/theme'
import { SEED_PRESETS, DEFAULT_SEED, seedColor, setSeedColor } from '@/themes/material/colors'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const SCHEMES = [
  { value: 'light', label: '浅色', icon: 'light_mode' },
  { value: 'dark', label: '深色', icon: 'dark_mode' },
]

const custom = ref('')
const customError = ref('')

watch(
  () => props.modelValue,
  (v) => {
    if (!v) return
    custom.value = SEED_PRESETS.some((p) => p.value === seedColor.value) ? '' : seedColor.value
    customError.value = ''
  },
)

function applyCustom() {
  const v = custom.value.trim()
  if (!/^#[0-9a-f]{6}$/i.test(v)) {
    customError.value = '请输入 6 位十六进制颜色，如 #6750A4'
    return
  }
  customError.value = ''
  setSeedColor(v)
}
</script>

<template>
  <MdDialog :model-value="modelValue" title="外观" icon="palette" width="480px" @update:model-value="emit('update:modelValue', $event)">
    <div class="appearance">
      <section class="appearance__section">
        <h3 class="appearance__heading md-title-small">界面风格</h3>
        <MdSegmentedButton :model-value="style" :options="STYLES" @update:model-value="setStyle" />
        <p class="appearance__hint md-body-small">经典风格是等宽字体、灰色系的紧凑界面；Material 3 是当前风格。切换后整个界面重新加载，数据不受影响。</p>
      </section>

      <section class="appearance__section">
        <h3 class="appearance__heading md-title-small">配色</h3>
        <MdSegmentedButton :model-value="scheme" :options="SCHEMES" @update:model-value="setScheme" />
      </section>

      <section class="appearance__section">
        <h3 class="appearance__heading md-title-small">种子色</h3>
        <p class="appearance__hint md-body-small">整套配色（主色、容器色、表面色调）都由一个种子色按 Material 3 动态配色算法生成。</p>
        <div class="appearance__swatches">
          <MdTooltip v-for="p in SEED_PRESETS" :key="p.value" :content="p.label">
            <button
              class="swatch"
              :class="{ 'is-active': seedColor === p.value }"
              type="button"
              :style="{ '--swatch': p.value }"
              :aria-label="p.label"
              :aria-pressed="seedColor === p.value"
              @click="setSeedColor(p.value)"
            >
              <MdIcon v-if="seedColor === p.value" name="check" :size="18" />
            </button>
          </MdTooltip>
        </div>
        <div class="appearance__custom">
          <MdTextField v-model="custom" dense label="自定义种子色" placeholder="#6750A4" :error="customError" class="appearance__custom-input" @enter="applyCustom">
            <template #trailing><span class="swatch swatch--preview" :style="{ '--swatch': /^#[0-9a-f]{6}$/i.test(custom) ? custom : 'transparent' }" /></template>
          </MdTextField>
          <MdButton variant="tonal" dense :disabled="!custom.trim()" @click="applyCustom">应用</MdButton>
        </div>
      </section>
    </div>
    <template #footer>
      <MdButton variant="text" :disabled="seedColor === DEFAULT_SEED" @click="setSeedColor(DEFAULT_SEED)">恢复默认种子色</MdButton>
      <MdButton variant="text" @click="emit('update:modelValue', false)">完成</MdButton>
    </template>
  </MdDialog>
</template>

<style scoped>
.appearance {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-6);
}

.appearance__section {
  display: flex;
  flex-direction: column;
  align-items: flex-start;
  gap: var(--md-space-3);
}

.appearance__heading {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.appearance__hint {
  margin: 0;
  color: var(--md-sys-color-on-surface-variant);
}

.appearance__swatches {
  display: flex;
  flex-wrap: wrap;
  gap: var(--md-space-2);
}

.swatch {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  width: 36px;
  height: 36px;
  padding: 0;
  border: 2px solid transparent;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--swatch);
  color: #fff;
  cursor: pointer;
  box-shadow: inset 0 0 0 1px rgba(0, 0, 0, 0.12);
  transition: transform var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard), border-color var(--md-sys-motion-duration-short2) var(--md-sys-motion-easing-standard);
}

.swatch:hover {
  transform: scale(1.08);
}

.swatch.is-active {
  border-color: var(--md-sys-color-on-surface);
}

.swatch--preview {
  width: 20px;
  height: 20px;
  cursor: default;
}

.appearance__custom {
  display: flex;
  align-items: flex-start;
  gap: var(--md-space-2);
  width: 100%;
}

.appearance__custom-input {
  flex: 1;
}
</style>
