import { get, set, addBlockEntry, removeBlockEntry } from '../shared/storage.js'

const form = document.getElementById('addForm')
const input = document.getElementById('addInput')
const addMsg = document.getElementById('addMsg')
const listEl = document.getElementById('blocklist')
const emptyEl = document.getElementById('empty')
const savedMsg = document.getElementById('savedMsg')

const SETTING_FIELDS = ['budgetMin', 'timerSec', 'expiryWarnSec']

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
  for (const key of SETTING_FIELDS) {
    document.getElementById(key).value = settings[key]
  }
}

let savedTimer
async function saveSettings() {
  const settings = await get('settings')
  for (const key of SETTING_FIELDS) {
    const raw = Number(document.getElementById(key).value)
    if (Number.isFinite(raw)) settings[key] = raw
  }
  await set('settings', settings)
  savedMsg.hidden = false
  clearTimeout(savedTimer)
  savedTimer = setTimeout(() => { savedMsg.hidden = true }, 1500)
}

for (const key of SETTING_FIELDS) {
  document.getElementById(key).addEventListener('change', saveSettings)
}

renderList()
loadSettings()
