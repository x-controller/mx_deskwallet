<script setup>
import MdIcon from '@/themes/material/components/MdIcon.vue'
import MdTextField from '@/themes/material/components/MdTextField.vue'
import MdButton from '@/themes/material/components/MdButton.vue'
import { useUnlockForm } from '@/composables/home/useUnlockForm'

const { password, password2, errors, loading, isNew, submit, reset } = useUnlockForm()
</script>

<template>
  <div class="unlock">
    <form class="unlock__card" @submit.prevent="submit">
      <span class="unlock__hero"><MdIcon name="shield" :size="32" /></span>
      <h1 class="unlock__title md-headline-small">Portunus</h1>
      <p class="unlock__hint md-body-medium">{{ isNew ? '设置口令，私钥将以此口令加密保存在本机' : '输入口令解锁金库' }}</p>
      <MdTextField v-model="password" type="password" :label="isNew ? '设置口令' : '口令'" :supporting-text="isNew ? '至少 6 位' : ''" :error="errors.password" autofocus @enter="submit" />
      <MdTextField v-if="isNew" v-model="password2" type="password" label="再次输入口令" :error="errors.password2" @enter="submit" />
      <MdButton native-type="submit" block :loading="loading" class="unlock__submit">{{ isNew ? '创建金库' : '解锁' }}</MdButton>
      <MdButton v-if="!isNew" variant="text" @click="reset">忘记口令？重置金库</MdButton>
    </form>
  </div>
</template>

<style scoped>
.unlock {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
  background: var(--md-sys-color-surface-container);
}

.unlock__card {
  display: flex;
  flex-direction: column;
  gap: var(--md-space-4);
  width: 360px;
  padding: var(--md-space-8) var(--md-space-6) var(--md-space-6);
  background: var(--md-sys-color-surface-container-lowest);
  border-radius: var(--md-sys-shape-corner-extra-large);
  box-shadow: var(--md-sys-elevation-level1);
  text-align: center;
}

.unlock__hero {
  display: inline-flex;
  align-items: center;
  justify-content: center;
  align-self: center;
  width: 64px;
  height: 64px;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-primary-container);
  color: var(--md-sys-color-on-primary-container);
}

.unlock__title {
  margin: 0;
  color: var(--md-sys-color-on-surface);
}

.unlock__hint {
  margin: calc(var(--md-space-2) * -1) 0 var(--md-space-2);
  color: var(--md-sys-color-on-surface-variant);
}

.unlock__submit {
  margin-top: var(--md-space-2);
}
</style>
