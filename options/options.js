import { get, set, addBlockEntry, removeBlockEntry } from '../shared/storage.js'

const form = document.getElementById('addForm')
const input = document.getElementById('addInput')
const addMsg = document.getElementById('addMsg')
const listEl = document.getElementById('blocklist')
const emptyEl = document.getElementById('empty')
const savedToast = document.getElementById('savedToast')

const NUMBER_FIELDS = ['budgetMin', 'timerSec', 'expiryWarnSec', 'factDwellSec', 'overrideDefaultMin', 'overrideDelaySec']
const STRING_FIELDS = ['difficulty']
const GATE_TYPES = ['timer', 'puzzle', 'fact']

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
  document.getElementById('surpriseMe').checked = settings.surpriseMe
  for (const type of GATE_TYPES) {
    document.getElementById(`gt-${type}`).checked = !!settings.gateTypes[type]
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
  settings.surpriseMe = document.getElementById('surpriseMe').checked
  settings.gateTypes = {}
  for (const type of GATE_TYPES) {
    settings.gateTypes[type] = document.getElementById(`gt-${type}`).checked
  }
  await set('settings', settings)
  flashSaved()
}

function wireSettings() {
  const ids = [...NUMBER_FIELDS, ...STRING_FIELDS, 'surpriseMe', ...GATE_TYPES.map(t => `gt-${t}`)]
  for (const id of ids) {
    document.getElementById(id).addEventListener('change', saveSettings)
  }
}

renderList()
loadSettings()
wireSettings()
