<script setup>
import { useRouter } from 'vue-router'
import { RiCompassDiscoverLine } from '@remixicon/vue'
import MxEmpty from '@/components/MxEmpty.vue'
import MxButton from '@/components/MxButton.vue'

const router = useRouter()
</script>

<template>
  <div class="not-found">
    <MxEmpty :icon="RiCompassDiscoverLine" text="页面不存在">
      <MxButton size="sm" type="primary" @click="router.replace({ name: 'home' })">返回首页</MxButton>
    </MxEmpty>
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
