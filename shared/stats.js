import { todayKey } from './time.js'

export function overrideDatesSet(overrideLog) {
  const set = new Set()
  for (const entry of overrideLog ?? []) set.add(todayKey(new Date(entry.ts)))
  return set
}

export function currentStreak(overrideLog, now, sinceKey) {
  const dates = overrideDatesSet(overrideLog)
  const day = new Date(now.getFullYear(), now.getMonth(), now.getDate())
  let streak = 0
  while (!dates.has(todayKey(day)) && streak <= 3650) {
    if (sinceKey && todayKey(day) < sinceKey) break
    streak++
    day.setDate(day.getDate() - 1)
  }
  return streak
}

export function overridesThisWeek(overrideLog, now) {
  const cutoff = now.getTime() - 7 * 24 * 60 * 60 * 1000
  return (overrideLog ?? []).filter(entry => entry.ts >= cutoff).length
}
