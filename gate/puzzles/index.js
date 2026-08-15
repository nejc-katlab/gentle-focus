import schulte from './schulte.js'

export const puzzles = [schulte]

export function getPuzzle(id) {
  return puzzles.find(p => p.id === id) ?? puzzles[0]
}
