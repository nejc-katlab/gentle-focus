import { test } from 'node:test'
import assert from 'node:assert/strict'
import { todayKey, isExpired, minutesToMs, secondsToMs, endOfLocalDay } from '../shared/time.js'

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

test('endOfLocalDay returns next local midnight', () => {
  const afternoon = new Date(2026, 7, 16, 15, 30, 0)
  const end = new Date(endOfLocalDay(afternoon))
  assert.equal(end.getFullYear(), 2026)
  assert.equal(end.getMonth(), 7)
  assert.equal(end.getDate(), 17)
  assert.equal(end.getHours(), 0)
  assert.equal(end.getMinutes(), 0)
  assert.ok(endOfLocalDay(afternoon) > afternoon.getTime())
})
