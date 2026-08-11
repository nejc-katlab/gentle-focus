export function secondsToMs(sec) {
  return sec * 1000
}

export function minutesToMs(min) {
  return min * 60 * 1000
}

export function isExpired(expiresAt, now) {
  return now >= expiresAt
}

export function todayKey(date) {
  const y = date.getFullYear()
  const m = String(date.getMonth() + 1).padStart(2, '0')
  const d = String(date.getDate()).padStart(2, '0')
  return `${y}-${m}-${d}`
}
