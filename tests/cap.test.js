import { test } from 'node:test'
import assert from 'node:assert/strict'
import { effectiveDailyCap } from '../shared/storage.js'

test('effectiveDailyCap falls back to the global cap', () => {
  assert.equal(effectiveDailyCap(null, { dailyCapMin: 30 }), 30)
  assert.equal(effectiveDailyCap({}, { dailyCapMin: 45 }), 45)
})

test('effectiveDailyCap prefers a positive per-entry cap', () => {
  assert.equal(effectiveDailyCap({ dailyCapMin: 10 }, { dailyCapMin: 30 }), 10)
})

test('effectiveDailyCap treats zero and non-finite as off', () => {
  assert.equal(effectiveDailyCap({ dailyCapMin: 0 }, { dailyCapMin: 45 }), 45)
  assert.equal(effectiveDailyCap(null, { dailyCapMin: 0 }), 0)
  assert.equal(effectiveDailyCap(null, {}), 0)
  assert.equal(effectiveDailyCap(null, { dailyCapMin: -5 }), 0)
})
