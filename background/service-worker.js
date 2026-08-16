import { findMatch } from '../shared/matcher.js'
import { get, set, getAll, seedDefaults, addUsageMinutes, bumpUnlockCount } from '../shared/storage.js'

const GATE_PATH = 'gate/gate.html'
const EXPIRE_PREFIX = 'expire:'
const WARN_PREFIX = 'warn:'
const TICK = 'tick'

function gateUrl(target, expired) {
  const params = new URLSearchParams({ target })
  if (expired) params.set('expired', '1')
  return `${chrome.runtime.getURL(GATE_PATH)}?${params.toString()}`
}

function isHttp(url) {
  return url.startsWith('http://') || url.startsWith('https://')
}

function scheduleWarn(pattern, expiresAt, warnSec) {
  if (!(warnSec > 0)) return
  const warnAt = expiresAt - warnSec * 1000
  if (warnAt > Date.now()) chrome.alarms.create(WARN_PREFIX + pattern, { when: warnAt })
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
  scheduleWarn(match.pattern, expiresAt, settings.expiryWarnSec)
  await bumpUnlockCount(match.pattern)
  return expiresAt
}

async function grantOverride(target, durationMin) {
  const { settings, blocklist, unlocks, overrideLog } = await getAll()
  const match = findMatch(target, blocklist)
  if (!match) return null
  const expiresAt = Date.now() + durationMin * 60 * 1000
  unlocks[match.pattern] = { expiresAt, grantedBy: 'override' }
  await set('unlocks', unlocks)
  chrome.alarms.create(EXPIRE_PREFIX + match.pattern, { when: expiresAt })
  scheduleWarn(match.pattern, expiresAt, settings.expiryWarnSec)
  await bumpUnlockCount(match.pattern)
  overrideLog.push({ site: match.pattern, ts: Date.now(), durationMin })
  await set('overrideLog', overrideLog.slice(-500))
  return expiresAt
}

async function expireUnlock(pattern) {
  const unlocks = await get('unlocks')
  if (unlocks[pattern]) {
    delete unlocks[pattern]
    await set('unlocks', unlocks)
  }
  chrome.alarms.clear(WARN_PREFIX + pattern)
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

async function warnSite(pattern) {
  const { blocklist, unlocks } = await getAll()
  const u = unlocks[pattern]
  if (!u || Date.now() >= u.expiresAt) return
  const entry = blocklist.find(e => e.pattern === pattern)
  if (!entry) return
  const tabs = await chrome.tabs.query({})
  for (const tab of tabs) {
    if (tab.id && tab.url && isHttp(tab.url) && findMatch(tab.url, [entry])) {
      chrome.scripting.executeScript({ target: { tabId: tab.id }, files: ['content/toast.js'] }).catch(() => {})
    }
  }
}

async function toastInfo(sender) {
  const url = sender?.tab?.url
  if (!url) return {}
  const { blocklist, unlocks } = await getAll()
  const match = findMatch(url, blocklist)
  if (!match) return {}
  const u = unlocks[match.pattern]
  if (!u || Date.now() >= u.expiresAt) return {}
  const mins = Math.max(1, Math.ceil((u.expiresAt - Date.now()) / 60000))
  return { message: `${mins} minute${mins === 1 ? '' : 's'} left on ${match.pattern}.` }
}

async function currentActiveSite() {
  let win
  try {
    win = await chrome.windows.getLastFocused()
  } catch {
    return null
  }
  if (!win || !win.focused) return null
  const [tab] = await chrome.tabs.query({ active: true, windowId: win.id })
  if (!tab || !tab.url || !isHttp(tab.url)) return null
  const { blocklist } = await getAll()
  const match = findMatch(tab.url, blocklist)
  if (!match) return null
  return (await activeUnlock(match.pattern)) ? match.pattern : null
}

async function flushTiming() {
  const timing = await get('timing')
  if (timing?.site && timing.since) {
    await addUsageMinutes(timing.site, (Date.now() - timing.since) / 60000)
  }
}

async function updateTiming() {
  await flushTiming()
  const site = await currentActiveSite()
  await set('timing', site ? { site, since: Date.now() } : { site: null, since: 0 })
}

async function reconcile() {
  await seedDefaults()
  const { unlocks, settings } = await getAll()
  const now = Date.now()
  let changed = false
  for (const [pattern, u] of Object.entries(unlocks)) {
    if (now >= u.expiresAt) {
      delete unlocks[pattern]
      changed = true
    } else {
      chrome.alarms.create(EXPIRE_PREFIX + pattern, { when: u.expiresAt })
      scheduleWarn(pattern, u.expiresAt, settings.expiryWarnSec)
    }
  }
  if (changed) await set('unlocks', unlocks)
  chrome.alarms.create(TICK, { periodInMinutes: 1 })
  updateTiming()
}

chrome.webNavigation.onBeforeNavigate.addListener(handleNavigation)
chrome.webNavigation.onHistoryStateUpdated.addListener(handleNavigation)

chrome.tabs.onActivated.addListener(() => updateTiming())
chrome.tabs.onUpdated.addListener((id, info) => {
  if (info.status === 'complete' || info.url) updateTiming()
})
chrome.windows.onFocusChanged.addListener(() => updateTiming())

chrome.alarms.onAlarm.addListener(alarm => {
  if (alarm.name === TICK) updateTiming()
  else if (alarm.name.startsWith(EXPIRE_PREFIX)) expireUnlock(alarm.name.slice(EXPIRE_PREFIX.length))
  else if (alarm.name.startsWith(WARN_PREFIX)) warnSite(alarm.name.slice(WARN_PREFIX.length))
})

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  if (msg?.type === 'GATE_COMPLETED') {
    grantUnlock(msg.target).then(expiresAt => sendResponse({ ok: true, expiresAt }))
    return true
  }
  if (msg?.type === 'OVERRIDE_REQUESTED') {
    grantOverride(msg.target, msg.durationMin).then(expiresAt => sendResponse({ ok: true, expiresAt }))
    return true
  }
  if (msg?.type === 'GET_TOAST_INFO') {
    toastInfo(sender).then(sendResponse)
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
