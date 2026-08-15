import { test } from 'node:test'
import assert from 'node:assert/strict'
import { buildOrder } from '../gate/puzzles/schulte.js'

test('buildOrder maps difficulty to grid size', () => {
  assert.equal(buildOrder('easy').size, 4)
  assert.equal(buildOrder('medium').size, 5)
  assert.equal(buildOrder('hard').size, 6)
  assert.equal(buildOrder('nonsense').size, 5)
})

test('buildOrder produces a complete permutation of 1..n^2', () => {
  for (const difficulty of ['easy', 'medium', 'hard']) {
    const { size, order } = buildOrder(difficulty)
    const count = size * size
    assert.equal(order.length, count)
    const sorted = [...order].sort((a, b) => a - b)
    assert.deepEqual(sorted, Array.from({ length: count }, (_, i) => i + 1))
  }
})
