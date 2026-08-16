import { test } from 'node:test'
import assert from 'node:assert/strict'
import { activeSession, effectiveStrictness, isManualSessionActive, isScheduleActive, parseHHMM } from '../shared/sessions.js'

test('parseHHMM parses minutes of day', () => {
  assert.equal(parseHHMM('09:00'), 540)
  assert.equal(parseHHMM('00:00'), 0)
  assert.equal(parseHHMM('23:59'), 1439)
  assert.equal(parseHHMM('bad'), null)
})

test('isManualSessionActive respects endsAt', () => {
  const now = new Date(2026, 7, 16, 10, 0)
  assert.ok(isManualSessionActive({ active: true, endsAt: now.getTime() + 1000 }, now))
  assert.ok(!isManualSessionActive({ active: true, endsAt: now.getTime() - 1000 }, now))
  assert.ok(!isManualSessionActive({ active: false, endsAt: now.getTime() + 1000 }, now))
})

test('isScheduleActive for a same-day window', () => {
  const sched = { enabled: true, strictness: 'firm', days: [1], start: '09:00', end: '12:00' }
  const monday1030 = new Date(2026, 7, 17, 10, 30)
  const monday0830 = new Date(2026, 7, 17, 8, 30)
  const tuesday1030 = new Date(2026, 7, 18, 10, 30)
  assert.ok(isScheduleActive(sched, monday1030))
  assert.ok(!isScheduleActive(sched, monday0830))
  assert.ok(!isScheduleActive(sched, tuesday1030))
})

test('isScheduleActive spanning midnight belongs to the start day', () => {
  const sched = { enabled: true, strictness: 'strict', days: [1], start: '22:00', end: '02:00' }
  const mondayLate = new Date(2026, 7, 17, 23, 0)
  const tuesdayEarly = new Date(2026, 7, 18, 1, 0)
  const tuesdayLate = new Date(2026, 7, 18, 23, 0)
  const mondayNoon = new Date(2026, 7, 17, 12, 0)
  assert.ok(isScheduleActive(sched, mondayLate))
  assert.ok(isScheduleActive(sched, tuesdayEarly))
  assert.ok(!isScheduleActive(sched, mondayNoon))
  assert.ok(!isScheduleActive(sched, tuesdayLate))
})

test('disabled schedule is never active', () => {
  const sched = { enabled: false, strictness: 'firm', days: [1], start: '09:00', end: '12:00' }
  assert.ok(!isScheduleActive(sched, new Date(2026, 7, 17, 10, 30)))
})

test('effectiveStrictness takes the strictest active source', () => {
  const now = new Date(2026, 7, 17, 10, 30)
  const firmSchedule = { enabled: true, strictness: 'firm', days: [1], start: '09:00', end: '12:00' }
  const gentleSession = { active: true, endsAt: now.getTime() + 60000, strictness: 'gentle' }
  assert.equal(effectiveStrictness({ session: gentleSession, schedules: [firmSchedule] }, now), 'firm')
  assert.equal(effectiveStrictness({ session: { active: false }, schedules: [] }, now), 'gentle')
  const strictSession = { active: true, endsAt: now.getTime() + 60000, strictness: 'strict' }
  assert.equal(effectiveStrictness({ session: strictSession, schedules: [firmSchedule] }, now), 'strict')
})

test('activeSession prefers a manual session and reports schedule source', () => {
  const now = new Date(2026, 7, 17, 10, 30)
  const schedule = { id: 'abc', enabled: true, strictness: 'firm', days: [1], start: '09:00', end: '12:00' }
  assert.equal(activeSession({ session: { active: false }, schedules: [schedule] }, now).source, 'schedule:abc')
  const manual = { active: true, endsAt: now.getTime() + 60000, strictness: 'strict', source: 'manual' }
  assert.equal(activeSession({ session: manual, schedules: [schedule] }, now).strictness, 'strict')
})
