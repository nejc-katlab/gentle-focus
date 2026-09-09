const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const css = name => getComputedStyle(document.documentElement).getPropertyValue(name).trim()

let uid = 0

function wave(W, H, y, amp, t, ph, k, sp) {
  let d = ''
  for (let i = 0; i <= 40; i++) {
    const x = (i / 40) * W
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + (y + amp * Math.sin(x * k + t * sp + ph)).toFixed(1) + ' '
  }
  return d + `L${W} ${H} L0 ${H} Z`
}

export function runFillButton(btn, seconds, onDone) {
  const id = `fill${++uid}`
  const label = btn.textContent.trim() || 'Continue'
  btn.disabled = true
  btn.classList.add('filling')
  btn.innerHTML = `
    <svg aria-hidden="true">
      <defs><clipPath id="${id}"><path class="clip"/></clipPath></defs>
      <path class="back" opacity="0.45"/>
      <path class="front"/>
      <text class="t-base" text-anchor="middle" dominant-baseline="central">${label}</text>
      <text class="t-fill" text-anchor="middle" dominant-baseline="central" clip-path="url(#${id})">${label}</text>
    </svg>
    <span class="label">${label}</span>`
  const svg = btn.querySelector('svg')
  const back = svg.querySelector('.back'), front = svg.querySelector('.front'), clip = svg.querySelector('.clip')
  const tBase = svg.querySelector('.t-base'), tFill = svg.querySelector('.t-fill')
  const total = Math.max(0.5, Number(seconds) || 0)
  const start = performance.now()
  let raf = 0

  function frame(t, p) {
    const W = btn.clientWidth, H = btn.clientHeight
    svg.setAttribute('viewBox', `0 0 ${W} ${H}`)
    const y = H * (1 - p) + 1.5
    const amp = reduce ? 0 : 3.2 * Math.min(1, p * 6) * Math.min(1, (1 - p) * 6 + 0.15)
    const f = wave(W, H, y, amp, t, 0, 0.028, 1.6)
    front.setAttribute('d', f); clip.setAttribute('d', f)
    back.setAttribute('d', wave(W, H, y, amp, t, 2.2, 0.022, -1.1))
    front.setAttribute('fill', css('--accent')); back.setAttribute('fill', css('--accent'))
    tBase.setAttribute('x', W / 2); tBase.setAttribute('y', H / 2); tBase.setAttribute('fill', css('--accent'))
    tFill.setAttribute('x', W / 2); tFill.setAttribute('y', H / 2); tFill.setAttribute('fill', css('--accent-ink'))
  }

  function finish() {
    btn.classList.remove('filling')
    btn.textContent = label
    const wrap = btn.parentElement
    if (wrap && wrap.classList.contains('btn-wrap') && !reduce) {
      wrap.classList.remove('rippling')
      void wrap.offsetWidth
      wrap.classList.add('rippling')
      setTimeout(() => wrap.classList.remove('rippling'), 1800)
    }
    onDone()
  }

  function loop(now) {
    const e = (now - start) / 1000
    const p = clamp(e / total, 0, 1)
    frame(e, p)
    if (p >= 1) finish()
    else raf = requestAnimationFrame(loop)
  }
  const staticP = typeof window !== 'undefined' ? window.__GF_FILL_STATIC : undefined
  if (typeof staticP === 'number') {
    frame(0, clamp(staticP, 0, 1))
    return () => {}
  }
  raf = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(raf)
}
