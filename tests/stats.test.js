import { test } from 'node:test'
import assert from 'node:assert/strict'
import { currentStreak, overridesThisWeek } from '../shared/stats.js'

function daysAgo(now, n) {
  const d = new Date(now.getFullYear(), now.getMonth(), now.getDate() - n, 12, 0)
  return d.getTime()
}

test('overridesThisWeek counts only the last 7 days', () => {
  const now = new Date(2026, 7, 16, 12, 0)
  const log = [
    { ts: daysAgo(now, 0) },
    { ts: daysAgo(now, 3) },
    { ts: daysAgo(now, 8) }
  ]
  assert.equal(overridesThisWeek(log, now), 2)
})

test('currentStreak is zero when today had an override', () => {
  const now = new Date(2026, 7, 16, 12, 0)
  const log = [{ ts: daysAgo(now, 0) }]
  assert.equal(currentStreak(log, now, '2026-01-01'), 0)
})

test('currentStreak counts days since the last override', () => {
  const now = new Date(2026, 7, 16, 12, 0)
  const log = [{ ts: daysAgo(now, 3) }]
  assert.equal(currentStreak(log, now, '2026-01-01'), 3)
})

test('currentStreak is floored at the install date', () => {
  const now = new Date(2026, 7, 16, 12, 0)
  assert.equal(currentStreak([], now, '2026-08-14'), 3)
})
