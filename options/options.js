import { get } from '../shared/storage.js'

const listEl = document.getElementById('blocklist')

async function render() {
  const blocklist = await get('blocklist')
  listEl.innerHTML = ''
  for (const entry of blocklist) {
    const li = document.createElement('li')
    li.textContent = entry.pattern
    listEl.appendChild(li)
  }
}

render()
