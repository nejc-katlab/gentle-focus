import { todayKey } from './time.js'
import { detectType, normalizePattern } from './matcher.js'

const DEFAULTS = {
  settings: {
    budgetMin: 10,
    timerSec: 15,
    expiryWarnSec: 60,
    dailyCapMin: 0,
    gateTypes: { timer: true, puzzle: true, fact: true },
    surpriseMe: false,
    factDwellSec: 20,
    difficulty: 'medium',
    overrideDefaultMin: 15,
    overrideDelaySec: 3,
    sessionDefaultMin: 25,
    sessionDefaultStrictness: 'gentle',
    sessionEndNotify: true,
    tone: 'encouraging',
    showStatsOnGate: false,
    puzzleModules: { schulte: true, unscramble: true, slide: true }
  },
  blocklist: [
    { pattern: 'reddit.com', type: 'domain' },
    { pattern: 'youtube.com', type: 'domain' }
  ],
  unlocks: {},
  pause: { expiresAt: 0 },
  session: { active: false, endsAt: 0, strictness: 'gentle', source: 'manual' },
  schedules: [],
  overrideLog: [],
  factsSeen: [],
  usageToday: { date: '', sites: {} },
  timing: { site: null, since: 0 },
  stats: { gatesPassed: 0, frictionCounts: { timer: 0, puzzle: 0, fact: 0 }, history: {} }
}

function withSettingDefaults(stored) {
  const d = DEFAULTS.settings
  return {
    ...d,
    ...stored,
    gateTypes: { ...d.gateTypes, ...(stored?.gateTypes) },
    puzzleModules: { ...d.puzzleModules, ...(stored?.puzzleModules) }
  }
}

function withDefaults(key, value) {
  if (value === undefined) return DEFAULTS[key]
  return key === 'settings' ? withSettingDefaults(value) : value
}

export async function get(key) {
  const stored = await chrome.storage.local.get(key)
  return withDefaults(key, stored[key])
}

export async function set(key, value) {
  await chrome.storage.local.set({ [key]: value })
}

export async function getAll() {
  const keys = Object.keys(DEFAULTS)
  const stored = await chrome.storage.local.get(keys)
  const out = {}
  for (const k of keys) out[k] = withDefaults(k, stored[k])
  return out
}

export async function seedDefaults() {
  const keys = Object.keys(DEFAULTS)
  const stored = await chrome.storage.local.get(keys)
  const toWrite = {}
  for (const k of keys) if (stored[k] === undefined) toWrite[k] = DEFAULTS[k]
  toWrite.settings = withSettingDefaults(stored.settings)
  const stats = { ...(stored.stats ?? DEFAULTS.stats) }
  if (!stats.installedOn) stats.installedOn = todayKey(new Date())
  toWrite.stats = stats
  await chrome.storage.local.set(toWrite)
}

export async function addBlockEntry(raw) {
  const pattern = normalizePattern(raw)
  if (!pattern) return { ok: false, reason: 'empty' }
  const blocklist = await get('blocklist')
  if (blocklist.some(e => e.pattern === pattern)) return { ok: false, reason: 'exists', pattern }
  blocklist.push({ pattern, type: detectType(pattern) })
  await set('blocklist', blocklist)
  return { ok: true, pattern }
}

export async function removeBlockEntry(pattern) {
  const blocklist = await get('blocklist')
  await set('blocklist', blocklist.filter(e => e.pattern !== pattern))
  const unlocks = await get('unlocks')
  if (unlocks[pattern]) {
    delete unlocks[pattern]
    await set('unlocks', unlocks)
  }
}

async function archiveDay(usage) {
  const stats = await get('stats')
  const history = stats.history ?? {}
  history[usage.date] = { minutes: usage.sites }
  const keys = Object.keys(history).sort()
  while (keys.length > 90) delete history[keys.shift()]
  stats.history = history
  await set('stats', stats)
}

export async function getUsageToday() {
  const today = todayKey(new Date())
  const usage = await get('usageToday')
  if (usage.date === today) return usage
  if (usage.date && Object.keys(usage.sites).length) await archiveDay(usage)
  const fresh = { date: today, sites: {} }
  await set('usageToday', fresh)
  return fresh
}

export async function addUsageMinutes(site, minutes) {
  if (!site || !(minutes > 0)) return
  const usage = await getUsageToday()
  const entry = usage.sites[site] ?? { minutes: 0, unlocks: 0 }
  entry.minutes += minutes
  usage.sites[site] = entry
  await set('usageToday', usage)
}

export async function bumpUnlockCount(site) {
  if (!site) return
  const usage = await getUsageToday()
  const entry = usage.sites[site] ?? { minutes: 0, unlocks: 0 }
  entry.unlocks += 1
  usage.sites[site] = entry
  await set('usageToday', usage)
}

export function effectiveDailyCap(entry, settings) {
  const perEntry = Number(entry?.dailyCapMin)
  if (Number.isFinite(perEntry) && perEntry > 0) return perEntry
  const global = Number(settings?.dailyCapMin)
  return Number.isFinite(global) && global > 0 ? global : 0
}
