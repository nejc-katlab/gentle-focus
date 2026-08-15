import { detectType, normalizePattern } from './matcher.js'

const DEFAULTS = {
  settings: {
    budgetMin: 10,
    timerSec: 15,
    expiryWarnSec: 60,
    gateTypes: { timer: true, puzzle: true, fact: true },
    surpriseMe: false,
    factDwellSec: 20,
    difficulty: 'medium',
    overrideDefaultMin: 15,
    overrideDelaySec: 3
  },
  blocklist: [
    { pattern: 'reddit.com', type: 'domain' },
    { pattern: 'youtube.com', type: 'domain' }
  ],
  unlocks: {},
  pause: { expiresAt: 0 },
  overrideLog: [],
  factsSeen: []
}

function withSettingDefaults(stored) {
  const d = DEFAULTS.settings
  return { ...d, ...stored, gateTypes: { ...d.gateTypes, ...(stored?.gateTypes) } }
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
