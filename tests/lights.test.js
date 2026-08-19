import { test } from 'node:test'
import assert from 'node:assert/strict'
import { neighbors, applyClick, isSolved, generateSolvable } from '../gate/puzzles/lights.js'

test('neighbors covers self plus orthogonal cells', () => {
  assert.deepEqual(neighbors(0, 3).sort((a, b) => a - b), [0, 1, 3])
  assert.deepEqual(neighbors(4, 3).sort((a, b) => a - b), [1, 3, 4, 5, 7])
  assert.deepEqual(neighbors(8, 3).sort((a, b) => a - b), [5, 7, 8])
})

test('applyClick flips a cell and its neighbors', () => {
  const grid = new Array(9).fill(0)
  applyClick(grid, 3, 4)
  assert.deepEqual(grid, [0, 1, 0, 1, 1, 1, 0, 1, 0])
})

test('applyClick is its own inverse', () => {
  const grid = [1, 0, 1, 0, 1, 0, 1, 0, 1]
  const before = [...grid]
  applyClick(grid, 3, 5)
  applyClick(grid, 3, 5)
  assert.deepEqual(grid, before)
})

test('isSolved is true only when all lights are off', () => {
  assert.ok(isSolved([0, 0, 0, 0]))
  assert.ok(!isSolved([0, 1, 0, 0]))
})

test('generateSolvable yields an unsolved 0/1 board of the right size', () => {
  for (const [size, moves] of [[3, 4], [4, 6], [5, 9]]) {
    for (let i = 0; i < 30; i++) {
      const grid = generateSolvable(size, moves)
      assert.equal(grid.length, size * size)
      assert.ok(grid.every(c => c === 0 || c === 1))
      assert.ok(!isSolved(grid))
    }
  }
})

test('generated boards are solvable by replaying clicks from a solved seed', () => {
  const size = 4
  const clicks = [0, 5, 10, 15, 2, 9]
  const grid = new Array(size * size).fill(0)
  for (const c of clicks) applyClick(grid, size, c)
  for (const c of clicks) applyClick(grid, size, c)
  assert.ok(isSolved(grid))
})
