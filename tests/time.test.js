import { test } from 'node:test'
import assert from 'node:assert/strict'
import { todayKey, isExpired, minutesToMs, secondsToMs } from '../shared/time.js'

test('secondsToMs and minutesToMs convert correctly', () => {
  assert.equal(secondsToMs(15), 15000)
  assert.equal(minutesToMs(10), 600000)
})

test('isExpired compares against now inclusively', () => {
  assert.ok(isExpired(1000, 1000))
  assert.ok(isExpired(1000, 1500))
  assert.ok(!isExpired(2000, 1500))
})

test('todayKey formats local date as YYYY-MM-DD', () => {
  assert.equal(todayKey(new Date(2026, 7, 12)), '2026-08-12')
  assert.equal(todayKey(new Date(2026, 0, 1)), '2026-01-01')
})
