const CX = 96, CY = 112, R = 58, TOP = 72, HALF = 42, BOT = CY + R, SPOUT = TOP - 18
const PULSE_W = 3.2, PULSE_K = 5
const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches
const clamp = (x, a, b) => Math.max(a, Math.min(b, x))
const ease = x => { x = clamp(x, 0, 1); return x * x * (3 - 2 * x) }
const rise = (p, a, b) => clamp((p - a) / (b - a), 0, 1)
const bowl = `M${CX - HALF} ${TOP} L${CX + HALF} ${TOP} A${R} ${R} 0 1 1 ${CX - HALF} ${TOP} Z`
const handle = `M${CX + 52} 90 C 196 82 196 146 ${CX + 50} 138`
const rim = `M${CX - HALF - 3} ${TOP} L${CX + HALF + 3} ${TOP}`
const levelOf = p => BOT - 4 - ease(p) * (BOT - 4 - (TOP + 8))
const circ = (x, y, r) => `<circle cx="${x.toFixed(1)}" cy="${y.toFixed(1)}" r="${Math.max(0, r).toFixed(1)}"/>`
const pulseAt = ph => 1 + 0.16 * Math.sin(ph) + 0.12 * Math.sin(ph * 1.618 + 1.3) + 0.08 * Math.sin(ph * 0.377 + 2.1)
const pulse = t => pulseAt(PULSE_K - t * PULSE_W)
const crest = th => Math.sin(th) + 0.12 * Math.sin(3 * th)
const ripple = (d, t, k, w, L) => crest(d * k - t * w + 0.5 * Math.sin(t * 0.41)) * Math.exp(-d / L) * pulse(t - d * k / w)

let uid = 0

function markup(id) {
  return `
    <svg class="mug" viewBox="0 0 200 200" aria-hidden="true">
      <defs>
        <clipPath id="${id}-clip"><path d="${bowl}"/></clipPath>
        <filter id="${id}-goo" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="3" result="b"/>
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 19 -7"/>
        </filter>
        <filter id="${id}-gooSoft" x="-20%" y="-20%" width="140%" height="140%">
          <feGaussianBlur in="SourceGraphic" stdDeviation="1.4" result="b"/>
          <feColorMatrix in="b" values="1 0 0 0 0  0 1 0 0 0  0 0 1 0 0  0 0 0 14 -5"/>
        </filter>
        <linearGradient id="${id}-inner" x1="0" y1="0" x2="0" y2="1">
          <stop offset="0" stop-color="#efe2cc"/><stop offset="1" stop-color="#d8c4a4"/>
        </linearGradient>
        <linearGradient id="${id}-brew" x1="0" y1="1" x2="0" y2="0">
          <stop offset="0" stop-color="#84553a"/><stop offset="1" stop-color="#b47f58"/>
        </linearGradient>
      </defs>
      <ellipse cx="${CX}" cy="${BOT + 8}" rx="52" ry="6" fill="#000" opacity="0.12"/>
      <g class="mug-scene">
        <path class="mug-steam"/><path class="mug-steam"/>
        <path d="${handle}" fill="none" stroke="#e6d8bf" stroke-width="15" stroke-linecap="round"/>
        <path d="${handle}" fill="none" stroke="#f4ebda" stroke-width="7" stroke-linecap="round"/>
        <path d="${bowl}" fill="#f4ebda" stroke="#e6d8bf" stroke-width="6" stroke-linejoin="round"/>
        <g clip-path="url(#${id}-clip)">
          <path d="${bowl}" fill="url(#${id}-inner)"/>
          <g class="mug-liquid" filter="url(#${id}-goo)" fill="url(#${id}-brew)"></g>
          <path class="mug-sheen" fill="none" stroke="#d9b48e" stroke-width="2.2" stroke-linecap="round" opacity="0.7"/>
          <g class="mug-pour" filter="url(#${id}-gooSoft)" fill="url(#${id}-brew)"></g>
        </g>
        <path d="${rim}" stroke="#e6d8bf" stroke-width="10" stroke-linecap="round"/>
        <path d="${rim}" stroke="#fbf4e7" stroke-width="4" stroke-linecap="round"/>
      </g>
    </svg>`
}

function smooth(pts) {
  let d = `M${pts[0][0].toFixed(1)} ${pts[0][1].toFixed(1)} `
  for (let i = 1; i < pts.length - 1; i++) {
    const mx = (pts[i][0] + pts[i + 1][0]) / 2, my = (pts[i][1] + pts[i + 1][1]) / 2
    d += `Q${pts[i][0].toFixed(1)} ${pts[i][1].toFixed(1)} ${mx.toFixed(1)} ${my.toFixed(1)} `
  }
  const l = pts[pts.length - 1]
  return d + `L${l[0].toFixed(1)} ${l[1].toFixed(1)} `
}

function surfaceAt(x, level, t, pour, settle) {
  if (reduce) return level
  const d = Math.abs(x - CX)
  const depth = level - TOP
  const dip = 5 * pour * pulse(t) * Math.exp(-(d * d) / 70)
  const born = 1 - Math.exp(-(d * d) / 140)
  const out = pour * born * 4.2 * ripple(d, t, 0.3, 4.2, 70)
  const rest = settle * 0.7 * Math.sin(x * 0.11 + t * 1.2) * Math.min(1, depth / 30)
  return level + dip + out + rest
}

function stream(level, t) {
  const top = SPOUT, bottom = level + 6
  let left = '', right = ''
  const n = 14
  for (let i = 0; i <= n; i++) {
    const q = i / n, y = top + (bottom - top) * q
    const sway = 0.8 * Math.sin(q * 4 - t * 3.5) * q
    const w = Math.max(2.2, (3.6 - 1.2 * q) * pulseAt(q * PULSE_K - t * PULSE_W))
    left += (i ? 'L' : 'M') + (CX + sway - w).toFixed(1) + ' ' + y.toFixed(1) + ' '
    right = 'L' + (CX + sway + w).toFixed(1) + ' ' + y.toFixed(1) + ' ' + right
  }
  return `<path d="${left}${right}Z"/>`
}

function splashes(level, t, pour) {
  let s = ''
  for (let i = 0; i < 4; i++) {
    const q = (t * 1.4 + i * 0.25) % 1
    const side = i % 2 ? 1 : -1
    const x = CX + side * (5 + 11 * q)
    const y = level - 7 * Math.sin(q * Math.PI) + 1
    s += circ(x, y, (2 - 1.6 * q) * pour)
  }
  return s
}

function steam(el, x0, t, ph, o) {
  let d = ''
  for (let i = 0; i <= 10; i++) {
    const y = 62 - i * 4.4
    const x = x0 + 5.5 * Math.sin(y * 0.2 + t * 1.3 + ph)
    d += (i ? 'L' : 'M') + x.toFixed(1) + ' ' + y.toFixed(1) + ' '
  }
  el.setAttribute('d', d)
  el.style.opacity = (o * (0.45 + 0.2 * Math.sin(t * 1.2 + ph))).toFixed(2)
}

export function mountMug(container) {
  const id = `mug${++uid}`
  container.innerHTML = markup(id)
  const svg = container.querySelector('svg')
  const scene = svg.querySelector('.mug-scene')
  const liquid = svg.querySelector('.mug-liquid')
  const sheen = svg.querySelector('.mug-sheen')
  const pourEl = svg.querySelector('.mug-pour')
  const [st1, st2] = svg.querySelectorAll('.mug-steam')

  function frame(t, p) {
    const bob = reduce ? 0 : 1.4 * Math.sin(t * 0.8)
    scene.setAttribute('transform', `translate(0 ${bob.toFixed(2)})`)
    const level = levelOf(p)
    const pour = reduce ? 0 : rise(p, 0, 0.05) * (1 - rise(p, 0.93, 0.985))
    const pts = []
    for (let i = 0; i <= 44; i++) { const x = 30 + (i / 44) * 132; pts.push([x, surfaceAt(x, level, t, pour, 1 - pour)]) }
    const d = smooth(pts)
    liquid.innerHTML = `<path d="${d} L162 200 L30 200 Z"/>`
    sheen.setAttribute('d', d)
    pourEl.innerHTML = pour > 0 ? stream(level, t) + splashes(level, t, pour) : ''
    pourEl.setAttribute('opacity', pour.toFixed(2))
    const fo = rise(p, 0.9, 1)
    steam(st1, CX - 10, t, 0, fo)
    steam(st2, CX + 12, t, 2, fo)
  }

  return { svg, frame }
}

export function runMug(container, seconds, onDone) {
  const mug = mountMug(container)
  const total = Math.max(0.5, Number(seconds) || 0)
  const start = performance.now()
  let done = false
  let raf = 0
  function loop(now) {
    const e = (now - start) / 1000
    const p = clamp(e / total, 0, 1)
    mug.frame(e, p)
    if (p >= 1 && !done) {
      done = true
      onDone()
    }
    if (!done || !reduce) raf = requestAnimationFrame(loop)
  }
  if (reduce) {
    mug.frame(0, 0)
    const id = setTimeout(() => { done = true; mug.frame(0, 1); onDone() }, total * 1000)
    return () => clearTimeout(id)
  }
  raf = requestAnimationFrame(loop)
  return () => cancelAnimationFrame(raf)
}

/* Backlog — "bubbling" fill for a possible fizzy-drink variant.
   Keeps a gooey crema line on the surface and lets small cream bubbles rise through the liquid and merge into it.
   Needs a second goo-filtered group (fill #dcb890) inside the clip, drawn after the liquid group.
function bubbling(foamEl, level, t, p) {
  const surf = x => surfaceAt(x, level, t, 0, 1)
  let fm = ''
  const n = 8
  for (let i = 0; i < n; i++) {
    const x = CX - HALF + 8 + (i / (n - 1)) * (HALF * 2 - 16)
    fm += circ(x, surf(x) + 1, 3.2 + 1.8 * Math.sin(t * 1.5 + i * 1.9))
  }
  const hash = n => { const s = Math.sin(n * 127.1 + 311.7) * 43758.5453; return s - Math.floor(s) }
  const chordHalf = y => { const d = R * R - (y - CY) * (y - CY); return d > 0 ? Math.sqrt(d) : 0 }
  if (p > 0.03) for (let i = 0; i < 5; i++) {
    const q = (t * 0.45 + hash(i + 20)) % 1
    const x = CX + (hash(i + 40) - 0.5) * 2 * (chordHalf(level + 8) - 10)
    const y = BOT - 8 - (BOT - 8 - level) * q
    if (y > level - 2) fm += circ(x + 2 * Math.sin(t * 3 + i), y, 1.6 + 2.4 * q)
  }
  foamEl.innerHTML = fm
}
*/
