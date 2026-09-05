import { test } from 'node:test'
import assert from 'node:assert/strict'
import { makeSequence, checkInput } from '../gate/puzzles/memory.js'

test('makeSequence has the right length and stays within pad range', () => {
  let seed = 0.37
  const rng = () => (seed = (seed * 9.19 + 0.113) % 1)
  const seq = makeSequence(5, 4, rng)
  assert.equal(seq.length, 5)
  assert.ok(seq.every(i => i >= 0 && i < 4))
})

test('checkInput reports partial, complete, and wrong', () => {
  const seq = [2, 0, 3, 1]
  assert.equal(checkInput(seq, []), 'partial')
  assert.equal(checkInput(seq, [2]), 'partial')
  assert.equal(checkInput(seq, [2, 0, 3]), 'partial')
  assert.equal(checkInput(seq, [2, 0, 3, 1]), 'complete')
  assert.equal(checkInput(seq, [2, 1]), 'wrong')
  assert.equal(checkInput(seq, [0]), 'wrong')
})
