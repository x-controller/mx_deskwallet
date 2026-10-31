<script setup>
import { computed, ref } from 'vue'
import { useRouter } from 'vue-router'
import { RiShieldKeyholeLine } from '@remixicon/vue'
import MxInput from '@/components/MxInput.vue'
import MxButton from '@/components/MxButton.vue'
import { useVaultStore } from '@/stores/vault'
import { confirm } from '@/utils/confirm'
import { message } from '@/utils/message'
import { validate, rules } from '@/utils/validate'

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
</script>

<template>
  <div class="unlock">
    <form class="unlock__card" @submit.prevent="submit">
      <RiShieldKeyholeLine size="36" class="unlock__icon" />
      <h1 class="unlock__title">Portunus</h1>
      <p class="unlock__hint">{{ isNew ? '设置口令，私钥将以此口令加密保存在本机' : '输入口令解锁' }}</p>
      <MxInput
        v-model="password"
        type="password"
        :placeholder="isNew ? '设置口令（至少 6 位）' : '口令'"
        :error="errors.password"
        autofocus
        @enter="submit"
      />
      <MxInput v-if="isNew" v-model="password2" type="password" placeholder="再次输入口令" :error="errors.password2" @enter="submit" />
      <MxButton type="primary" native-type="submit" block :loading="loading">{{ isNew ? '创建金库' : '解锁' }}</MxButton>
      <MxButton v-if="!isNew" size="sm" @click="reset">忘记口令？重置金库</MxButton>
    </form>
  </div>
</template>

<style scoped>
.unlock {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}

.unlock__card {
  display: flex;
  flex-direction: column;
  gap: var(--mx-space-sm);
  width: 320px;
  padding: var(--mx-space-lg);
  background: var(--mx-color-surface);
  border-radius: var(--mx-radius-lg);
  text-align: center;
}

.unlock__icon {
  align-self: center;
  color: var(--mx-color-primary);
}

.unlock__title {
  margin: 0;
  font-size: var(--mx-font-lg);
  font-weight: 600;
}

.unlock__hint {
  margin: 0 0 var(--mx-space-sm);
  font-size: var(--mx-font-sm);
  color: var(--mx-color-text-secondary);
}
</style>
