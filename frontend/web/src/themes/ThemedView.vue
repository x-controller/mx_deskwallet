<script setup>
import { computed } from 'vue'
import { useRoute } from 'vue-router'
import { style } from '@/utils/theme'
import { themes } from '@/themes'

/** 路由统一挂这个组件，由它按当前界面风格解析真正的页面；风格切换时页面组件变化，整棵树重挂 */
const route = useRoute()
const view = computed(() => themes[style.value].views[route.name])
</script>

<template>
  <component :is="view" />
</template>
