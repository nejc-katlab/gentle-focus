import { get, set, seedDefaults, addBlockEntry, removeBlockEntry } from '../shared/storage.js'

const form = document.getElementById('addForm')
const input = document.getElementById('addInput')
const addMsg = document.getElementById('addMsg')
const listEl = document.getElementById('blocklist')
const emptyEl = document.getElementById('empty')
const savedToast = document.getElementById('savedToast')

const NUMBER_FIELDS = ['budgetMin', 'timerSec', 'expiryWarnSec', 'dailyCapMin', 'factDwellSec', 'overrideDefaultMin', 'overrideDelaySec', 'sessionDefaultMin']
const STRING_FIELDS = ['difficulty', 'sessionDefaultStrictness', 'tone']
const CHECK_FIELDS = ['surpriseMe', 'sessionEndNotify', 'showStatsOnGate']
const GATE_TYPES = ['timer', 'puzzle', 'fact']
const PUZZLE_MODULES = ['schulte', 'unscramble', 'slide', 'lights', 'math', 'memory']
const DAY_LABELS = ['Sun', 'Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat']

const scheduleList = document.getElementById('scheduleList')
const scheduleEmpty = document.getElementById('scheduleEmpty')
const scheduleForm = document.getElementById('scheduleForm')
const schedName = document.getElementById('schedName')
const schedDays = document.getElementById('schedDays')
const schedStart = document.getElementById('schedStart')
const schedEnd = document.getElementById('schedEnd')
const schedStrictness = document.getElementById('schedStrictness')

async function renderList() {
  const blocklist = await get('blocklist')
  listEl.innerHTML = ''
  emptyEl.hidden = blocklist.length > 0
  for (const entry of blocklist) {
    const li = document.createElement('li')

    const label = document.createElement('span')
    label.className = 'pattern'
    label.textContent = entry.pattern
    const tag = document.createElement('span')
    tag.className = 'type-tag'
    tag.textContent = entry.type
    label.appendChild(tag)

    const remove = document.createElement('button')
    remove.className = 'remove'
    remove.textContent = 'Remove'
    remove.addEventListener('click', async () => {
      await removeBlockEntry(entry.pattern)
      renderList()
    })

    li.append(label, remove)
    listEl.appendChild(li)
  }
}

function showAddMsg(text) {
  addMsg.textContent = text
  addMsg.hidden = !text
}

form.addEventListener('submit', async e => {
  e.preventDefault()
  const result = await addBlockEntry(input.value)
  if (result.ok) {
    input.value = ''
    showAddMsg('')
    renderList()
  } else if (result.reason === 'exists') {
    showAddMsg(`${result.pattern} is already on your list.`)
  } else {
    showAddMsg('Enter a site like reddit.com or youtube.com/shorts/*')
  }
})

async function loadSettings() {
  const settings = await get('settings')
  for (const key of [...NUMBER_FIELDS, ...STRING_FIELDS]) {
    document.getElementById(key).value = settings[key]
  }
  for (const key of CHECK_FIELDS) {
    document.getElementById(key).checked = !!settings[key]
  }
  for (const type of GATE_TYPES) {
    document.getElementById(`gt-${type}`).checked = !!settings.gateTypes[type]
  }
  for (const id of PUZZLE_MODULES) {
    document.getElementById(`pm-${id}`).checked = settings.puzzleModules?.[id] !== false
  }
}

let toastTimer
function flashSaved() {
  savedToast.hidden = false
  clearTimeout(toastTimer)
  toastTimer = setTimeout(() => { savedToast.hidden = true }, 1200)
}

async function saveSettings() {
  const settings = await get('settings')
  for (const key of NUMBER_FIELDS) {
    const raw = Number(document.getElementById(key).value)
    if (Number.isFinite(raw)) settings[key] = raw
  }
  for (const key of STRING_FIELDS) {
    settings[key] = document.getElementById(key).value
  }
  for (const key of CHECK_FIELDS) {
    settings[key] = document.getElementById(key).checked
  }
  settings.gateTypes = {}
  for (const type of GATE_TYPES) {
    settings.gateTypes[type] = document.getElementById(`gt-${type}`).checked
  }
  settings.puzzleModules = {}
  for (const id of PUZZLE_MODULES) {
    settings.puzzleModules[id] = document.getElementById(`pm-${id}`).checked
  }
  await set('settings', settings)
  flashSaved()
}

function wireSettings() {
  const ids = [
    ...NUMBER_FIELDS,
    ...STRING_FIELDS,
    ...CHECK_FIELDS,
    ...GATE_TYPES.map(t => `gt-${t}`),
    ...PUZZLE_MODULES.map(p => `pm-${p}`)
  ]
  for (const id of ids) {
    document.getElementById(id).addEventListener('change', saveSettings)
  }
}

function buildDayPickers() {
  for (let i = 0; i < DAY_LABELS.length; i++) {
    const label = document.createElement('label')
    label.className = 'day'
    const cb = document.createElement('input')
    cb.type = 'checkbox'
    cb.value = String(i)
    label.append(cb, document.createTextNode(DAY_LABELS[i]))
    schedDays.appendChild(label)
  }
}

async function updateSchedule(id, patch) {
  const schedules = await get('schedules')
  await set('schedules', schedules.map(s => (s.id === id ? { ...s, ...patch } : s)))
  flashSaved()
}

async function removeSchedule(id) {
  const schedules = await get('schedules')
  await set('schedules', schedules.filter(s => s.id !== id))
}

async function renderSchedules() {
  const schedules = await get('schedules')
  scheduleList.innerHTML = ''
  scheduleEmpty.hidden = schedules.length > 0
  for (const s of schedules) {
    const li = document.createElement('li')

    const info = document.createElement('span')
    info.className = 'pattern'
    info.textContent = s.name || '(unnamed)'
    const meta = document.createElement('span')
    meta.className = 'type-tag'
    const days = (s.days ?? []).map(d => DAY_LABELS[d]).join(' ') || 'no days'
    meta.textContent = `${days} · ${s.start}–${s.end} · ${s.strictness}`
    info.appendChild(meta)

    const toggle = document.createElement('input')
    toggle.type = 'checkbox'
    toggle.checked = !!s.enabled
    toggle.addEventListener('change', () => updateSchedule(s.id, { enabled: toggle.checked }))

    const remove = document.createElement('button')
    remove.className = 'remove'
    remove.textContent = 'Remove'
    remove.addEventListener('click', async () => {
      await removeSchedule(s.id)
      renderSchedules()
    })

    const actions = document.createElement('div')
    actions.className = 'sched-actions'
    actions.append(toggle, remove)

    li.append(info, actions)
    scheduleList.appendChild(li)
  }
}

scheduleForm.addEventListener('submit', async e => {
  e.preventDefault()
  const days = [...schedDays.querySelectorAll('input:checked')].map(cb => Number(cb.value))
  const schedule = {
    id: crypto.randomUUID(),
    name: schedName.value.trim(),
    enabled: true,
    strictness: schedStrictness.value,
    days,
    start: schedStart.value,
    end: schedEnd.value
  }
  const schedules = await get('schedules')
  schedules.push(schedule)
  await set('schedules', schedules)
  schedName.value = ''
  for (const cb of schedDays.querySelectorAll('input:checked')) cb.checked = false
  renderSchedules()
  flashSaved()
})

const ALL_KEYS = ['settings', 'blocklist', 'schedules', 'stats', 'overrideLog']

function downloadJson(filename, obj) {
  const blob = new Blob([JSON.stringify(obj, null, 2)], { type: 'application/json' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = filename
  a.click()
  URL.revokeObjectURL(url)
}

function readJsonFile(file) {
  return new Promise((resolve, reject) => {
    const reader = new FileReader()
    reader.onload = () => {
      try {
        resolve(JSON.parse(reader.result))
      } catch (err) {
        reject(err)
      }
    }
    reader.onerror = () => reject(reader.error)
    reader.readAsText(file)
  })
}

document.getElementById('exportBlocklist').addEventListener('click', async () => {
  downloadJson('gentle-focus-blocklist.json', await get('blocklist'))
})

const importBlockFile = document.getElementById('importBlockFile')
document.getElementById('importBlocklist').addEventListener('click', () => importBlockFile.click())
importBlockFile.addEventListener('change', async () => {
  const file = importBlockFile.files[0]
  if (!file) return
  try {
    const data = await readJsonFile(file)
    if (!Array.isArray(data)) throw new Error('bad')
    for (const item of data) {
      const raw = typeof item === 'string' ? item : item?.pattern
      if (raw) await addBlockEntry(raw)
    }
    renderList()
    flashSaved()
  } catch {
    showAddMsg('That file did not look like a blocklist.')
  }
  importBlockFile.value = ''
})

document.getElementById('openStats').addEventListener('click', () => {
  window.open(chrome.runtime.getURL('stats/stats.html'))
})

document.getElementById('exportAll').addEventListener('click', async () => {
  const bundle = { app: 'gentle-focus', version: 1 }
  for (const key of ALL_KEYS) bundle[key] = await get(key)
  downloadJson('gentle-focus-data.json', bundle)
})

const importAllFile = document.getElementById('importAllFile')
document.getElementById('importAll').addEventListener('click', () => importAllFile.click())
importAllFile.addEventListener('change', async () => {
  const file = importAllFile.files[0]
  if (!file) return
  try {
    const data = await readJsonFile(file)
    if (!data || typeof data !== 'object') throw new Error('bad')
    for (const key of ALL_KEYS) if (key in data) await set(key, data[key])
    location.reload()
  } catch {
    alert('That file did not look like a Gentle Focus export.')
  }
  importAllFile.value = ''
})

document.getElementById('resetAll').addEventListener('click', async () => {
  if (!confirm('This clears all Gentle Focus data and settings on this device. Continue?')) return
  await chrome.storage.local.clear()
  await seedDefaults()
  location.reload()
})

renderList()
loadSettings()
wireSettings()
buildDayPickers()
renderSchedules()
