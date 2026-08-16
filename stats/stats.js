import { todayKey } from '../shared/time.js'
import { get, getUsageToday } from '../shared/storage.js'
import { currentStreak, overridesThisWeek } from '../shared/stats.js'

const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']
const FRICTION_LABELS = { timer: 'Timer', puzzle: 'Puzzle', fact: 'Fun fact' }
const now = new Date()

document.getElementById('back').addEventListener('click', () => chrome.runtime.openOptionsPage())

function sumMinutes(sites) {
  return Object.values(sites ?? {}).reduce((total, entry) => total + (entry?.minutes ?? 0), 0)
}

function renderFriction(counts) {
  const wrap = document.getElementById('friction')
  const keys = ['timer', 'puzzle', 'fact']
  const total = keys.reduce((t, k) => t + (counts[k] ?? 0), 0)
  if (!total) {
    const p = document.createElement('p')
    p.className = 'empty'
    p.textContent = 'No gates passed yet.'
    wrap.appendChild(p)
    return
  }
  for (const key of keys) {
    const value = counts[key] ?? 0
    const row = document.createElement('div')
    row.className = 'bar-row'
    const label = document.createElement('span')
    label.className = 'bar-label'
    label.textContent = FRICTION_LABELS[key]
    const track = document.createElement('div')
    track.className = 'bar-track'
    const fill = document.createElement('div')
    fill.className = 'bar-fill'
    fill.style.width = `${Math.round((value / total) * 100)}%`
    track.appendChild(fill)
    const val = document.createElement('span')
    val.className = 'bar-val'
    val.textContent = String(value)
    row.append(label, track, val)
    wrap.appendChild(row)
  }
}

function renderToday(usage) {
  const list = document.getElementById('today')
  const entries = Object.entries(usage.sites)
  document.getElementById('todayEmpty').hidden = entries.length > 0
  for (const [site, entry] of entries) {
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.className = 'pattern'
    name.textContent = site
    const meta = document.createElement('span')
    meta.className = 'meta'
    meta.textContent = `${Math.round(entry.minutes)} min · ${entry.unlocks} unlock${entry.unlocks === 1 ? '' : 's'}`
    li.append(name, meta)
    list.appendChild(li)
  }
}

function renderWeek(history, usage) {
  const list = document.getElementById('week')
  const todayStr = todayKey(now)
  for (let i = 6; i >= 0; i--) {
    const day = new Date(now.getFullYear(), now.getMonth(), now.getDate() - i)
    const key = todayKey(day)
    const sites = key === todayStr ? usage.sites : history[key]?.minutes
    const total = Math.round(sumMinutes(sites))
    const li = document.createElement('li')
    const name = document.createElement('span')
    name.className = 'pattern'
    name.textContent = `${DAY_LABELS[day.getDay()]} ${day.getMonth() + 1}/${day.getDate()}`
    const meta = document.createElement('span')
    meta.className = 'meta'
    meta.textContent = `${total} min`
    li.append(name, meta)
    list.appendChild(li)
  }
}

async function main() {
  const [stats, overrideLog, usage] = await Promise.all([get('stats'), get('overrideLog'), getUsageToday()])
  document.getElementById('streak').textContent = String(currentStreak(overrideLog, now, stats.installedOn))
  document.getElementById('gates').textContent = String(stats.gatesPassed ?? 0)
  document.getElementById('ovWeek').textContent = String(overridesThisWeek(overrideLog, now))
  document.getElementById('ovTotal').textContent = String(overrideLog.length)
  renderFriction(stats.frictionCounts ?? {})
  renderToday(usage)
  renderWeek(stats.history ?? {}, usage)
}

main()
