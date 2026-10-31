import { computed } from 'vue'
import { verifyLabel, chainIdOf } from '@/utils/dapp'

/** dApp 身份卡：图标、校验结果、域名。props 需要 metadata、verifyContext */
export function useDappPeer(props) {
  const icon = computed(() => props.metadata?.icons?.[0] ?? '')
  const verify = computed(() => verifyLabel(props.verifyContext))
  const host = computed(() => {
    try {
      return new URL(props.metadata?.url ?? '').host
    } catch {
      return props.metadata?.url ?? ''
    }
  })
  return { icon, verify, host }
}

/** 会话里暴露的钱包地址集合 */
export const sessionAccounts = (s) => new Set((s.namespaces?.eip155?.accounts ?? []).map((a) => a.split(':')[2]))
/** 会话里涉及的链 id 列表 */
export const sessionChains = (s) => [...new Set((s.namespaces?.eip155?.accounts ?? []).map((a) => chainIdOf(`${a.split(':')[0]}:${a.split(':')[1]}`)))]
