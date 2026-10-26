<script setup>
import { computed } from 'vue'
import MxAddress from '@/components/MxAddress.vue'
import MxTag from '@/components/MxTag.vue'

const props = defineProps({
  /** message | typedData */
  kind: { type: String, required: true },
  /** parseSignMessage / parseTypedData 的结果 */
  payload: { type: Object, required: true },
  walletName: { type: String, default: '' },
})

const typedJson = computed(() => (props.kind === 'typedData' ? JSON.stringify(props.payload.typed.message, null, 2) : ''))
const domain = computed(() => props.payload.typed?.domain ?? {})
</script>

<template>
  <div class="sign-summary">
    <p class="sign-summary__row">
      <span class="sign-summary__label">签名方</span>
      <span class="sign-summary__value">
        <span v-if="walletName">{{ walletName }}</span>
        <MxAddress :address="payload.address" :head="8" :tail="6" />
        <MxTag v-if="!walletName" type="danger">不是本钱包的地址</MxTag>
      </span>
    </p>

    <template v-if="kind === 'message'">
      <p class="sign-summary__row">
        <span class="sign-summary__label">消息</span>
        <MxTag v-if="payload.text === null" type="danger">二进制数据，无法预览</MxTag>
      </p>
      <pre class="sign-summary__pre">{{ payload.text ?? payload.message }}</pre>
    </template>

    <template v-else>
      <p class="sign-summary__row">
        <span class="sign-summary__label">域</span>
        <span class="sign-summary__value">{{ domain.name || '—' }}<template v-if="domain.version"> v{{ domain.version }}</template><template v-if="domain.chainId"> · Chain {{ domain.chainId }}</template></span>
      </p>
      <p v-if="domain.verifyingContract" class="sign-summary__row">
        <span class="sign-summary__label">合约</span>
        <span class="sign-summary__value"><MxAddress :address="domain.verifyingContract" :head="8" :tail="6" /></span>
      </p>
      <p class="sign-summary__row">
        <span class="sign-summary__label">类型</span>
        <span class="sign-summary__value">{{ payload.typed.primaryType }}</span>
      </p>
      <pre class="sign-summary__pre">{{ typedJson }}</pre>
    </template>
  </div>
</template>

<style scoped>
.sign-summary {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-xs);
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-bg);
  font-size: var(--mx-font-sm);
}

.sign-summary__row {
  display: flex;
  align-items: center;
  gap: var(--mx-space-sm);
  margin: 0;
  min-height: var(--mx-size-xs);
}

.sign-summary__label {
  width: 56px;
  flex-shrink: 0;
  color: var(--mx-color-text-secondary);
}

.sign-summary__value {
  display: inline-flex;
  align-items: center;
  flex-wrap: wrap;
  gap: var(--mx-space-xs);
  min-width: 0;
  word-break: break-all;
}

.sign-summary__pre {
  margin: 0;
  max-height: 200px;
  overflow: auto;
  padding: var(--mx-space-sm);
  border-radius: var(--mx-radius-sm);
  background: var(--mx-color-surface);
  white-space: pre-wrap;
  word-break: break-all;
  line-height: 1.5;
}
</style>
