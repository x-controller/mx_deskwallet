import { defineStore } from 'pinia'
import { computed } from 'vue'
import { useVaultStore } from './vault'
import { getProvider, runPool, errorText, isTron, nativeDecimals } from '@/utils/chain'
import { getTxInfo } from '@/utils/tron'

/** Tron 记录没带过期时间时，按广播后 10 分钟算 */
const TRON_DEFAULT_EXPIRE_MS = 10 * 60 * 1000

const uid = () => crypto.randomUUID()

/** 回执 → 记录字段（成功 / 回滚都算已结算） */
function fromReceipt(receipt) {
  const gasUsed = receipt.gasUsed ?? 0n
  const price = receipt.gasPrice ?? 0n
  return {
    status: receipt.status === 1 ? 'success' : 'failed',
    settledAt: Date.now(),
    blockNumber: receipt.blockNumber,
    gasUsed: gasUsed.toString(),
    fee: (receipt.fee ?? gasUsed * price).toString(),
    error: receipt.status === 1 ? '' : receipt.tronResult ? `交易执行失败：${receipt.tronResult}` : '交易执行失败（已回滚）',
  }
}

/**
 * 交易记录：本应用发出的每一笔链上交易，随金库加密落盘
 * 记录结构：{ id, hash, kind: transfer | batch | collect | drain | approve | swap | dapp, networkId, networkName, chainId, chainType: evm | tron, nativeSymbol, nativeDecimals,
 *   from, to, nonce, expiresAt(Tron 交易过期时间), asset: { symbol, decimals, address|null }, amount(十进制字符串), toAsset, amountOut, note,
 *   status: pending | success | failed | dropped, createdAt, settledAt, blockNumber, gasUsed, fee, error }
 */
export const useTxStore = defineStore('tx', () => {
  const vault = useVaultStore()

  /** 新的在前 */
  const txs = computed(() => vault.data?.txs ?? [])
  const pendingCount = computed(() => txs.value.filter((t) => t.status === 'pending').length)

  const find = (id) => vault.data.txs.find((t) => t.id === id)

  /** 资产快照：原生币 address 为 null */
  const snapshotAsset = (a) => (a ? { symbol: a.symbol, decimals: a.decimals, address: a.native ? null : a.address } : null)

  /**
   * 广播成功后立即登记一条待确认记录，返回记录 id
   * kind：transfer | batch | collect | drain | approve | swap | dapp；swap 额外带 toAsset / amountOut（报价）
   */
  function add({ kind, network, from, to, hash, nonce, asset, amount, toAsset = null, amountOut = null, note = '', expiresAt = 0 }) {
    const record = {
      id: uid(),
      hash,
      kind,
      networkId: network.id,
      networkName: network.name,
      chainId: network.chainId,
      chainType: network.type === 'tron' ? 'tron' : 'evm',
      nativeSymbol: network.symbol,
      nativeDecimals: nativeDecimals(network),
      from,
      to,
      nonce,
      expiresAt,
      asset: snapshotAsset(asset),
      amount: amount.toString(),
      toAsset: snapshotAsset(toAsset),
      amountOut: amountOut === null ? '' : amountOut.toString(),
      note,
      status: 'pending',
      createdAt: Date.now(),
      settledAt: 0,
      blockNumber: 0,
      gasUsed: '',
      fee: '',
      error: '',
    }
    vault.data.txs.unshift(record)
    vault.persist()
    return record.id
  }

  /**
   * 结算：有回执则按回执定成败；没有回执只记下错误、保持待确认（可能只是网络超时，之后轮询再补）
   * 交易被同 nonce 的新交易替换时，记录替换后的哈希
   */
  function settle(id, receipt, error) {
    const t = find(id)
    if (!t || t.status !== 'pending') return
    if (error?.replacement?.hash) t.hash = error.replacement.hash
    if (receipt) Object.assign(t, fromReceipt(receipt))
    else if (error) t.error = errorText(error)
    vault.persist()
  }

  /** 轮询待确认交易：拿到回执则结算；链上查不到且 nonce 已被占用则标记已丢弃 */
  async function refreshPending(networks) {
    const pending = txs.value.filter((t) => t.status === 'pending')
    if (!pending.length) return 0
    let settled = 0
    await runPool(pending, 4, async (t) => {
      const network = networks.find((n) => n.id === t.networkId)
      if (!network) return
      try {
        if (isTron(network)) {
          const receipt = await getTxInfo(network, t.hash)
          if (receipt) {
            Object.assign(t, fromReceipt(receipt))
            settled++
          } else if (Date.now() > (t.expiresAt || t.createdAt + TRON_DEFAULT_EXPIRE_MS) + 90_000) {
            Object.assign(t, { status: 'dropped', settledAt: Date.now(), error: '交易已过期，未被打包' })
            settled++
          }
          return
        }
        const provider = getProvider(network)
        const receipt = await provider.getTransactionReceipt(t.hash)
        if (receipt) {
          Object.assign(t, fromReceipt(receipt))
          settled++
          return
        }
        if (t.nonce === undefined || t.nonce === null) return
        const [tx, nonce] = await Promise.all([provider.getTransaction(t.hash), provider.getTransactionCount(t.from, 'latest')])
        if (!tx && nonce > t.nonce) {
          Object.assign(t, { status: 'dropped', settledAt: Date.now(), error: '链上查不到该交易，nonce 已被其他交易占用' })
          settled++
        }
      } catch {
        /* 单条查询失败不影响其他，下次轮询再试 */
      }
    })
    if (settled) await vault.persist()
    return settled
  }

  async function remove(ids) {
    const set = new Set(ids)
    vault.data.txs = vault.data.txs.filter((t) => !set.has(t.id))
    await vault.persist()
  }

  async function clear() {
    vault.data.txs = []
    await vault.persist()
  }

  return { txs, pendingCount, add, settle, refreshPending, remove, clear }
})
