<script setup>
import { computed } from 'vue'
import { RiFileCopyLine } from '@remixicon/vue'
import MxTooltip from './MxTooltip.vue'
import MxButton from './MxButton.vue'
import { shortAddress } from '@/utils/format'
import { copyText } from '@/utils/storage'
import { message } from '@/utils/message'

const props = defineProps({
  address: { type: String, required: true },
  head: { type: Number, default: 6 },
  tail: { type: Number, default: 4 },
  /** 完整显示，不缩略 */
  full: { type: Boolean, default: false },
  copyable: { type: Boolean, default: true },
  /** 复制按钮底色类型，透传给 MxButton */
  buttonType: { type: String, default: 'surface' },
})

const text = computed(() => (props.full ? props.address : shortAddress(props.address, props.head, props.tail)))

async function copy() {
  try {
    await copyText(props.address)
    message.success('地址已复制')
  } catch {
    message.error('复制失败')
  }
}
</script>

<template>
  <span class="mx-address">
    <MxTooltip :content="full ? '' : address">
      <span class="mx-address__text">{{ text }}</span>
    </MxTooltip>
    <MxTooltip v-if="copyable" content="复制地址">
      <MxButton icon size="xs" :type="buttonType" aria-label="复制地址" @click.stop="copy">
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
