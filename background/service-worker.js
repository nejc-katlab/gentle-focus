import { findMatch } from '../shared/matcher.js'
import { get, set, getAll, seedDefaults } from '../shared/storage.js'

const GATE_PATH = 'gate/gate.html'
const EXPIRE_PREFIX = 'expire:'

function gateUrl(target, expired) {
  const params = new URLSearchParams({ target })
  if (expired) params.set('expired', '1')
  return `${chrome.runtime.getURL(GATE_PATH)}?${params.toString()}`
}

function isHttp(url) {
  return url.startsWith('http://') || url.startsWith('https://')
}

async function isPaused() {
  const pause = await get('pause')
  return Date.now() < (pause?.expiresAt ?? 0)
}

async function activeUnlock(pattern) {
  const unlocks = await get('unlocks')
  const u = unlocks[pattern]
  return u && Date.now() < u.expiresAt ? u : null
}

async function handleNavigation(details) {
  if (details.frameId !== 0) return
  const { tabId, url } = details
  if (!isHttp(url)) return
  const { blocklist } = await getAll()
  const match = findMatch(url, blocklist)
  if (!match) return
  if (await isPaused()) return
  if (await activeUnlock(match.pattern)) return
  chrome.tabs.update(tabId, { url: gateUrl(url) })
}

async function grantUnlock(target) {
  const { settings, blocklist, unlocks } = await getAll()
  const match = findMatch(target, blocklist)
  if (!match) return null
  const expiresAt = Date.now() + settings.budgetMin * 60 * 1000
  unlocks[match.pattern] = { expiresAt, grantedBy: 'gate' }
  await set('unlocks', unlocks)
  chrome.alarms.create(EXPIRE_PREFIX + match.pattern, { when: expiresAt })
  return expiresAt
}

async function expireUnlock(pattern) {
  const unlocks = await get('unlocks')
  if (unlocks[pattern]) {
    delete unlocks[pattern]
    await set('unlocks', unlocks)
  }
  const { blocklist } = await getAll()
  const entry = blocklist.find(e => e.pattern === pattern)
  if (!entry) return
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.url && findMatch(tab.url, [entry])) {
      chrome.tabs.update(tab.id, { url: gateUrl(tab.url, true) })
    }
  }
}

async function reconcile() {
  await seedDefaults()
  const unlocks = await get('unlocks')
  const now = Date.now()
  let changed = false
  for (const [pattern, u] of Object.entries(unlocks)) {
    if (now >= u.expiresAt) {
      delete unlocks[pattern]
      changed = true
    } else {
      chrome.alarms.create(EXPIRE_PREFIX + pattern, { when: u.expiresAt })
    }
  }
  if (changed) await set('unlocks', unlocks)
}

chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation)
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation)

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name.startsWith(EXPIRE_PREFIX)) {
    expireUnlock(alarm.name.slice(EXPIRE_PREFIX.length))
  }
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'GATE_COMPLETED') {
    grantUnlock(msg.target).then(expiresAt => sendResponse({ ok: true, expiresAt }))
    return true
  }
  if (msg?.type === 'GET_STATE') {
    getAll().then(state => sendResponse(state))
    return true
  }
  return false
})

chrome.runtime.onInstalled.addListener(reconcile)
chrome.runtime.onStartup.addListener(reconcile)
