import math from './math.js'
import slide from './slide.js'
import lights from './lights.js'
import memory from './memory.js'
import schulte from './schulte.js'
import unscramble from './unscramble.js'

export const puzzles = [schulte, unscramble, slide, lights, math, memory]

export function getPuzzle(id) {
  return puzzles.find(p => p.id === id) ?? puzzles[0]
}

export function enabledPuzzles(settings) {
  const modules = settings?.puzzleModules ?? {}
  const on = puzzles.filter(p => modules[p.id] !== false)
  return on.length ? on : puzzles
}
