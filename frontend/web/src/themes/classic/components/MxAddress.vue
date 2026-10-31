<script setup>
import { RiFileCopyLine } from '@remixicon/vue'
import MxTooltip from './MxTooltip.vue'
import MxButton from './MxButton.vue'
import { useCopyAddress } from '@/composables/ui/useCopyAddress'

const props = defineProps({
  address: { type: String, required: true },
  head: { type: Number, default: 6 },
  tail: { type: Number, default: 4 },
  /** 完整显示，不缩略 */
  full: { type: Boolean, default: false },
  copyable: { type: Boolean, default: true },
  /** 复制按钮底色类型，透传给 MxButton */
  buttonType: { type: String, default: 'surface' },
  /** 这串十六进制是什么（地址 / 哈希），用于复制按钮文案与提示 */
  label: { type: String, default: '地址' },
})

const { text, copy } = useCopyAddress(props)
</script>

<template>
  <span class="mx-address">
    <MxTooltip :content="full ? '' : address">
      <span class="mx-address__text">{{ text }}</span>
    </MxTooltip>
    <MxTooltip v-if="copyable" :content="`复制${label}`">
      <MxButton icon size="xs" :type="buttonType" :aria-label="`复制${label}`" @click.stop="copy">
        <RiFileCopyLine size="14" />
      </MxButton>
    </MxTooltip>
  </span>
</template>

<style scoped>
.mx-address {
  display: inline-flex;
  align-items: center;
  gap: var(--mx-space-xs);
  min-width: 0;
}

.mx-address__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}
</style>
