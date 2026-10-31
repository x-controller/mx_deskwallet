/** 与链无关的通用帮助：并发池、重试、错误文案（EVM 与 Tron 两套链上实现共用） */

/** 并发受限地批量执行任务 */
export async function runPool(items, limit, worker) {
  const queue = [...items]
  const runners = Array.from({ length: Math.min(limit, queue.length) }, async () => {
    while (queue.length) await worker(queue.shift())
  })
  await Promise.all(runners)
}

/** 公共 RPC 偶发限流 / 超时，失败后间隔重试 */
export async function withRetry(fn, times = 2, delay = 800) {
  let lastError
  for (let i = 0; i <= times; i++) {
    try {
      return await fn()
    } catch (e) {
      lastError = e
      if (i < times) await new Promise((r) => setTimeout(r, delay * (i + 1)))
    }
  }
  throw lastError
}

export function errorText(e) {
  return e?.shortMessage || e?.reason || e?.message || String(e)
}

export const sleep = (ms) => new Promise((r) => setTimeout(r, ms))
