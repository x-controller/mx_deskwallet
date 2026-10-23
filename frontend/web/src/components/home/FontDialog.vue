<script setup>
import { computed, ref, watch } from 'vue'
import MxDialog from '@/components/MxDialog.vue'
import MxInput from '@/components/MxInput.vue'
import MxButton from '@/components/MxButton.vue'
import MxTag from '@/components/MxTag.vue'
import { FONT_PRESETS, fontFamily, isStackAvailable, setFont } from '@/utils/font'

const props = defineProps({
  modelValue: { type: Boolean, default: false },
})

const emit = defineEmits(['update:modelValue'])

const SAMPLE = '0x19E7E3…DAff2A  钱包 1  12.3456 ETH'

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
</script>

<template>
  <MxDialog :model-value="modelValue" title="字体" width="480px" @update:model-value="emit('update:modelValue', $event)">
    <div class="font">
      <div class="font__list">
        <button
          v-for="p in presets"
          :key="p.label"
          class="font-item"
          :class="{ 'is-active': fontFamily === p.value && !custom, 'is-disabled': !p.installed }"
          :disabled="!p.installed"
          @click="choose(p)"
        >
          <span class="font-item__name">{{ p.label }}</span>
          <span class="font-item__sample" :style="{ fontFamily: p.value || undefined }">{{ SAMPLE }}</span>
          <MxTag v-if="!p.installed">未安装</MxTag>
        </button>
      </div>

      <div class="font__custom">
        <span class="font__label">自定义</span>
        <MxInput v-model="custom" size="sm" placeholder='字体栈，如 "LXGW WenKai Mono", monospace' class="font__input" @enter="applyCustom" />
        <MxButton size="sm" type="primary" :disabled="!custom.trim()" @click="applyCustom">应用</MxButton>
      </div>
      <p class="font__hint">点选即时生效并保存在本机；中文字形由系统按字体栈回退。</p>
    </div>
    <template #footer>
      <MxButton size="sm" :disabled="!fontFamily" @click="setFont('')">恢复默认</MxButton>
      <MxButton size="sm" type="primary" @click="emit('update:modelValue', false)">完成</MxButton>
    </template>
  </MxDialog>
</template>

<style scoped>
.font {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
}

.font__list {
  display: flex;
  flex-direction: column;
  max-height: 320px;
  overflow-y: auto;
}

.font-item {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  height: var(--mx-size-md);
  margin-bottom: var(--mx-space-xxs);
  padding: 0 var(--mx-space-sm);
  border: none;
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  color: var(--mx-color-text);
  text-align: left;
  cursor: pointer;
  transition: background var(--mx-transition);
}

.font-item:hover:not(:disabled) {
  background: var(--mx-color-bg-hover);
}

.font-item.is-active {
  background: var(--mx-color-bg-active);
}

.font-item.is-disabled {
  color: var(--mx-color-text-disabled);
  cursor: not-allowed;
}

.font-item__name {
  width: 150px;
  flex-shrink: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.font-item__sample {
  flex: 1;
  min-width: 0;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.font__custom {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
}

.font__label {
  flex-shrink: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}

.font__input {
  flex: 1;
}

.font__hint {
  margin: 0;
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
