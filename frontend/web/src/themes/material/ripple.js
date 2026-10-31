/**
 * v-ripple：Material 3 按压涟漪。按下时从指针位置扩散一个 currentColor 的圆，
 * 松开 / 离开后淡出。宿主需 position: relative 且 overflow: hidden（各组件自带）。
 * 样式见 styles/global.css 的 .md-ripple。
 */
function spawn(host, e) {
  if (host.disabled || host.getAttribute('aria-disabled') === 'true') return
  const rect = host.getBoundingClientRect()
  const size = Math.max(rect.width, rect.height) * 2
  const x = (e.clientX ?? rect.left + rect.width / 2) - rect.left - size / 2
  const y = (e.clientY ?? rect.top + rect.height / 2) - rect.top - size / 2
  const el = document.createElement('span')
  el.className = 'md-ripple'
  el.style.cssText = `width:${size}px;height:${size}px;left:${x}px;top:${y}px;`
  host.appendChild(el)
  const grow = el.animate([{ transform: 'scale(0)' }, { transform: 'scale(1)' }], { duration: 450, easing: 'cubic-bezier(0.2, 0, 0, 1)', fill: 'forwards' })
  let released = false
  const release = () => {
    if (released) return
    released = true
    grow.finished.then(() => {
      el.animate([{ opacity: 1 }, { opacity: 0 }], { duration: 250, easing: 'linear', fill: 'forwards' }).finished.then(() => el.remove())
    })
  }
  host.addEventListener('pointerup', release, { once: true })
  host.addEventListener('pointerleave', release, { once: true })
  host.addEventListener('pointercancel', release, { once: true })
}

export const ripple = {
  mounted(el) {
    el.__ripple = (e) => {
      if (e.button !== 0) return
      spawn(el, e)
    }
    el.addEventListener('pointerdown', el.__ripple)
  },
  unmounted(el) {
    el.removeEventListener('pointerdown', el.__ripple)
  },
}
