import { test } from 'node:test'
import assert from 'node:assert/strict'
import { evaluate, makeProblem, isCorrect } from '../gate/puzzles/math.js'

test('evaluate handles each operator', () => {
  assert.equal(evaluate(7, 8, '+'), 15)
  assert.equal(evaluate(9, 4, '−'), 5)
  assert.equal(evaluate(6, 3, '×'), 18)
})

test('makeProblem never yields a negative subtraction and answer matches', () => {
  let seed = 0.999
  const rng = () => (seed = (seed * 7.13 + 0.271) % 1)
  for (const difficulty of ['easy', 'medium', 'hard']) {
    for (let i = 0; i < 200; i++) {
      const p = makeProblem(difficulty, rng)
      if (p.op === '−') assert.ok(p.answer >= 0)
      assert.equal(p.answer, evaluate(p.a, p.b, p.op))
      assert.ok(p.a >= 1 && p.b >= 1)
    }
  }
})

test('isCorrect accepts the exact integer answer only', () => {
  assert.ok(isCorrect('15', 15))
  assert.ok(isCorrect(' 15 ', 15))
  assert.ok(!isCorrect('14', 15))
  assert.ok(!isCorrect('', 15))
  assert.ok(!isCorrect('abc', 15))
  assert.ok(!isCorrect('15.5', 15))
})
