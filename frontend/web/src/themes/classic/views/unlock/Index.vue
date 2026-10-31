<script setup>
import { RiShieldKeyholeLine } from '@remixicon/vue'
import MxInput from '@/themes/classic/components/MxInput.vue'
import MxButton from '@/themes/classic/components/MxButton.vue'
import { useUnlockForm } from '@/composables/home/useUnlockForm'

const { password, password2, errors, loading, isNew, submit, reset } = useUnlockForm()
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
