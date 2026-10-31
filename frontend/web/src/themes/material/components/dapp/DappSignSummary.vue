<script setup>
import MdAddress from '@/themes/material/components/MdAddress.vue'
import MdChip from '@/themes/material/components/MdChip.vue'
import MdKeyValue from '@/themes/material/components/MdKeyValue.vue'
import { useDappSignSummary } from '@/composables/dapp/useDappSummary'

const props = defineProps({
  /** message | typedData */
  kind: { type: String, required: true },
  /** parseSignMessage / parseTypedData 的结果 */
  payload: { type: Object, required: true },
  walletName: { type: String, default: '' },
})

const { typedJson, domain, domainText } = useDappSignSummary(props)
</script>

<template>
  <div class="sign-summary">
    <MdKeyValue label="签名方">
      <span v-if="walletName">{{ walletName }}</span>
      <MdAddress :address="payload.address" :head="8" :tail="6" />
      <MdChip v-if="!walletName" tone="error">不是本钱包的地址</MdChip>
    </MdKeyValue>

    <template v-if="kind === 'message'">
      <MdKeyValue label="消息">
        <MdChip v-if="payload.text === null" tone="error">二进制数据，无法预览</MdChip>
      </MdKeyValue>
      <pre class="sign-summary__pre md-body-small md-mono">{{ payload.text ?? payload.message }}</pre>
    </template>

    <template v-else>
      <MdKeyValue label="域">{{ domainText }}</MdKeyValue>
      <MdKeyValue v-if="domain.verifyingContract" label="合约"><MdAddress :address="domain.verifyingContract" :head="8" :tail="6" /></MdKeyValue>
      <MdKeyValue label="类型">{{ payload.typed.primaryType }}</MdKeyValue>
      <pre class="sign-summary__pre md-body-small md-mono">{{ typedJson }}</pre>
    </template>
  </div>
</template>

<style scoped>
.sign-summary {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-2);
  padding: var(--md-space-3) var(--md-space-4);
  border-radius: var(--md-sys-shape-corner-medium);
  background: var(--md-sys-color-surface-container);
}

.sign-summary__pre {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  padding: var(--md-space-3);
  border-radius: var(--md-sys-shape-corner-small);
  background: var(--md-sys-color-surface-container-lowest);
  color: var(--md-sys-color-on-surface);
  white-space: pre-wrap;
  word-break: break-all;
}
</style>
