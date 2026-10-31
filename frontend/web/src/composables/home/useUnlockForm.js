import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { useVaultStore } from '@/stores/vault'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { validate, rules } from '@/utils/validate'

/** 解锁页：首次设置口令 / 解锁 / 重置金库 */
export function useUnlockForm() {
  const router = useRouter()
  const vault = useVaultStore()

  const password = ref('')
  const password2 = ref('')
  const errors = ref({})
  const loading = ref(false)

  const isNew = computed(() => vault.status === 'new')

  async function submit() {
    const schema = { password: [rules.required('请输入口令')] }
    if (isNew.value) {
      schema.password.push(rules.minLength(6, '口令至少 6 位'))
      schema.password2 = [rules.same(() => password.value)]
    }
    errors.value = validate({ password: password.value, password2: password2.value }, schema)
    if (Object.keys(errors.value).length) return

    loading.value = true
    try {
      if (isNew.value) await vault.setup(password.value)
      else await vault.unlock(password.value)
      router.replace({ name: 'home' })
    } catch (e) {
      errors.value = { password: e.message || '解锁失败' }
    } finally {
      loading.value = false
    }
  }

  async function reset() {
    const ok = await confirm({
      title: '重置金库',
      content: '将删除本机保存的全部钱包、分组与网络配置，且无法恢复。\n请确认已备份私钥。',
      confirmText: '确认重置',
    })
    if (!ok) return
    await vault.reset()
    password.value = ''
    password2.value = ''
    errors.value = {}
    message.success('已重置，请设置新口令')
  }

  return { password, password2, errors, loading, isNew, submit, reset }
}
