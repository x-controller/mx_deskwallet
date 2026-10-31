<script setup>
import MdIcon from './MdIcon.vue'
import MdIconButton from './MdIconButton.vue'
import MdTooltip from './MdTooltip.vue'
import { useCopyAddress } from '@/composables/ui/useCopyAddress'

const props = defineProps({
  address: { type: String, required: true },
  head: { type: Number, default: 6 },
  tail: { type: Number, default: 4 },
  /** 完整显示，不缩略 */
  full: { type: Boolean, default: false },
  copyable: { type: Boolean, default: true },
  /** 这串十六进制是什么（地址 / 哈希），用于复制按钮文案与提示 */
  label: { type: String, default: '地址' },
})

const { text, copy } = useCopyAddress(props)
</script>

<template>
  <span class="md-address">
    <MdTooltip :content="full ? '' : address">
      <span class="md-address__text">{{ text }}</span>
    </MdTooltip>
    <MdTooltip v-if="copyable" :content="`复制${label}`">
      <MdIconButton size="xs" :aria-label="`复制${label}`" @click.stop="copy">
        <MdIcon name="content_copy" />
      </MdIconButton>
    </MdTooltip>
  </span>
</template>

<style scoped>
.md-address {
  display: inline-flex;
  align-items: center;
  gap: var(--md-space-1);
  min-width: 0;
}

.md-address__text {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
  font-family: var(--md-ref-typeface-mono);
  letter-spacing: 0;
}
</style>
