<script setup>
import { useRouter } from 'vue-router'
import MdEmpty from '@/themes/material/components/MdEmpty.vue'
import MdButton from '@/themes/material/components/MdButton.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <MdEmpty icon="explore" text="页面不存在">
      <MdButton variant="tonal" @click="router.replace({ name: 'home' })">返回首页</MdButton>
    </MdEmpty>
  </div>
</template>

<style scoped>
.not-found {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100%;
}
</style>
