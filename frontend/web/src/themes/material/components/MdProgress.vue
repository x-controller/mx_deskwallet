<script setup>
defineProps({
  /** circular | linear */
  type: { type: String, default: 'circular' },
  /** 圆形指示器直径 */
  size: { type: Number, default: 24 },
})
</script>

<template>
  <span v-if="type === 'linear'" class="md-progress-linear" role="progressbar" aria-label="加载中">
    <span class="md-progress-linear__bar" />
  </span>
  <svg v-else class="md-progress" :width="size" :height="size" viewBox="0 0 48 48" role="progressbar" aria-label="加载中">
    <circle class="md-progress__track" cx="24" cy="24" r="20" />
    <circle class="md-progress__arc" cx="24" cy="24" r="20" />
  </svg>
</template>

<style scoped>
.md-progress {
  flex-shrink: 0;
  animation: md-progress-rotate 1.6s linear infinite;
}

.md-progress__track,
.md-progress__arc {
  fill: none;
  stroke-width: 4;
  stroke-linecap: round;
}

.md-progress__track {
  stroke: transparent;
}

.md-progress__arc {
  stroke: currentColor;
  stroke-dasharray: 126;
  animation: md-progress-dash 1.4s var(--md-sys-motion-easing-standard) infinite;
}

@keyframes md-progress-rotate {
  to {
    transform: rotate(360deg);
  }
}

@keyframes md-progress-dash {
  0% {
    stroke-dashoffset: 120;
    transform: rotate(0deg);
    transform-origin: center;
  }

  50% {
    stroke-dashoffset: 30;
    transform: rotate(135deg);
    transform-origin: center;
  }

  100% {
    stroke-dashoffset: 120;
    transform: rotate(450deg);
    transform-origin: center;
  }
}

.md-progress-linear {
  position: relative;
  display: block;
  width: 100%;
  height: 4px;
  overflow: hidden;
  border-radius: var(--md-sys-shape-corner-full);
  background: var(--md-sys-color-surface-container-highest);
}

.md-progress-linear__bar {
  position: absolute;
  inset: 0 auto 0 0;
  width: 40%;
  border-radius: inherit;
  background: var(--md-sys-color-primary);
  animation: md-progress-slide 1.2s var(--md-sys-motion-easing-standard) infinite;
}

@keyframes md-progress-slide {
  from {
    transform: translateX(-100%);
  }

  to {
    transform: translateX(260%);
  }
}
</style>
