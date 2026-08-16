import { test } from 'node:test'
import assert from 'node:assert/strict'
import { sortedLetters, scramble, isValidAnswer } from '../gate/puzzles/unscramble.js'
import { countInversions, isSolvable, isSolved, generateSolvable } from '../gate/puzzles/slide.js'

test('sortedLetters normalizes letter order', () => {
  assert.equal(sortedLetters('cat'), 'act')
  assert.equal(sortedLetters('LISTEN'), 'eilnst')
})

test('scramble keeps the same letters and can differ from the original', () => {
  const reverse = arr => arr.reverse()
  assert.equal(scramble('abcde', reverse), 'edcba')
  assert.equal(sortedLetters(scramble('planet', reverse)), sortedLetters('planet'))
  assert.notEqual(scramble('abc', arr => arr), 'abc')
})

test('isValidAnswer accepts any wordlist anagram of the letters', () => {
  const wordset = new Set(['listen', 'silent', 'planet'])
  assert.ok(isValidAnswer('silent', 'listen', wordset))
  assert.ok(isValidAnswer('LISTEN', 'silent', wordset))
  assert.ok(!isValidAnswer('litsen', 'listen', wordset))
  assert.ok(!isValidAnswer('planet', 'listen', wordset))
  assert.ok(!isValidAnswer('', 'listen', wordset))
})

test('countInversions and isSolved on the goal state', () => {
  assert.equal(countInversions([1, 2, 3, 4, 5, 6, 7, 8, 0]), 0)
  assert.ok(isSolved([1, 2, 3, 4, 5, 6, 7, 8, 0]))
  assert.ok(!isSolved([2, 1, 3, 4, 5, 6, 7, 8, 0]))
})

test('isSolvable rejects a single-swap 3x3 board', () => {
  assert.ok(isSolvable([1, 2, 3, 4, 5, 6, 7, 8, 0], 3))
  assert.ok(!isSolvable([2, 1, 3, 4, 5, 6, 7, 8, 0], 3))
})

test('generateSolvable always yields a solvable, unsolved permutation', () => {
  for (const size of [3, 4]) {
    for (let i = 0; i < 30; i++) {
      const tiles = generateSolvable(size)
      assert.equal(tiles.length, size * size)
      assert.deepEqual([...tiles].sort((a, b) => a - b), Array.from({ length: size * size }, (_, k) => k))
      assert.ok(isSolvable(tiles, size))
      assert.ok(!isSolved(tiles))
    }
  }
})
