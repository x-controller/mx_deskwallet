<script setup>
import { computed, watch } from 'vue'
import { style } from '@/utils/theme'
import { themes } from '@/themes'

/** 根组件只负责按当前界面风格挂页面和全局反馈层（消息 / 确认框），具体界面全在 themes/ 下各风格目录里 */
const current = computed(() => themes[style.value])

watch(style, (value) => themes[value].setup?.(), { immediate: true })
</script>

<template>
  <router-view />
  <component :is="current.Message" :key="`message-${style}`" />
  <component :is="current.Confirm" :key="`confirm-${style}`" />
</template>
