import { get, addBlockEntry } from '../shared/storage.js'
import { findMatch, hostFromUrl } from '../shared/matcher.js'

const statusEl = document.getElementById('status')
const hintEl = document.getElementById('hint')
const blockBtn = document.getElementById('blockBtn')
const optionsBtn = document.getElementById('optionsBtn')

optionsBtn.addEventListener('click', () => {
  chrome.runtime.openOptionsPage()
})

async function activeTab() {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  return tab
}

async function init() {
  const pause = await get('pause')
  const blocklist = await get('blocklist')
  const paused = Date.now() < (pause?.expiresAt ?? 0)

  statusEl.textContent = paused ? 'Paused' : 'Active'

  const tabInfo = await activeTab()
  const url = tabInfo?.url ?? ''
  const host = hostFromUrl(url)
  const isWeb = url.startsWith('http://') || url.startsWith('https://')

  if (!isWeb || !host) {
    hintEl.textContent = `${blocklist.length} site${blocklist.length === 1 ? '' : 's'} on your blocklist.`
    return
  }

  if (findMatch(url, blocklist)) {
    hintEl.textContent = `${host} is already on your blocklist.`
    return
  }

  hintEl.textContent = `${blocklist.length} site${blocklist.length === 1 ? '' : 's'} on your blocklist.`
  blockBtn.hidden = false
  blockBtn.textContent = `Block ${host}`
  blockBtn.addEventListener('click', async () => {
    blockBtn.disabled = true
    await addBlockEntry(host)
    blockBtn.textContent = `${host} blocked`
    hintEl.textContent = 'It will ask for a moment next time you visit.'
  })
}

init()
