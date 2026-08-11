const DEFAULTS = {
  settings: { budgetMin: 10, timerSec: 15, expiryWarnSec: 60 },
  blocklist: [
    { pattern: 'reddit.com', type: 'domain' },
    { pattern: 'youtube.com', type: 'domain' }
  ],
  unlocks: {},
  pause: { expiresAt: 0 }
}

export async function get(key) {
  const stored = await chrome.storage.local.get(key)
  return stored[key] ?? DEFAULTS[key]
}

export async function set(key, value) {
  await chrome.storage.local.set({ [key]: value })
}

export async function getAll() {
  const keys = Object.keys(DEFAULTS)
  const stored = await chrome.storage.local.get(keys)
  const out = {}
  for (const k of keys) out[k] = stored[k] ?? DEFAULTS[k]
  return out
}

export async function seedDefaults() {
  const keys = Object.keys(DEFAULTS)
  const stored = await chrome.storage.local.get(keys)
  const missing = {}
  for (const k of keys) if (stored[k] === undefined) missing[k] = DEFAULTS[k]
  if (Object.keys(missing).length) await chrome.storage.local.set(missing)
}
