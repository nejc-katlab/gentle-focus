const SIZES = { easy: 3, medium: 4, hard: 5 }
const MOVES = { easy: 4, medium: 6, hard: 9 }

export function neighbors(index, size) {
  const row = Math.floor(index / size)
  const col = index % size
  const out = [index]
  if (row > 0) out.push(index - size)
  if (row < size - 1) out.push(index + size)
  if (col > 0) out.push(index - 1)
  if (col < size - 1) out.push(index + 1)
  return out
}

export function applyClick(grid, size, index) {
  for (const n of neighbors(index, size)) grid[n] ^= 1
  return grid
}

export function isSolved(grid) {
  return grid.every(cell => cell === 0)
}

export function generateSolvable(size, moves, rng = Math.random) {
  const total = size * size
  const grid = new Array(total).fill(0)
  do {
    for (let i = 0; i < moves; i++) applyClick(grid, size, Math.floor(rng() * total))
  } while (isSolved(grid))
  return grid
}

export default {
  id: 'lights',
  name: 'Lights out',
  generate(difficulty) {
    const size = SIZES[difficulty] ?? 4
    const moves = MOVES[difficulty] ?? 6
    const grid = generateSolvable(size, moves)

    return {
      mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.setAttribute('role', 'status')
        status.textContent = 'Turn every light off. A tap flips a tile and its neighbors.'

        const gridEl = document.createElement('div')
        gridEl.className = 'lights'
        gridEl.style.setProperty('--n', size)

        const cells = []
        const paint = index => {
          const cell = cells[index]
          const on = grid[index] === 1
          cell.className = on ? 'lights-cell on' : 'lights-cell'
          cell.setAttribute('aria-pressed', on ? 'true' : 'false')
          cell.setAttribute('aria-label', `Light ${index + 1} ${on ? 'on' : 'off'}`)
        }

        for (let index = 0; index < grid.length; index++) {
          const cell = document.createElement('button')
          cell.type = 'button'
          cell.addEventListener('click', () => {
            applyClick(grid, size, index)
            for (const n of neighbors(index, size)) paint(n)
            if (isSolved(grid)) {
              status.textContent = 'All off — lovely.'
              for (const c of cells) c.disabled = true
              onComplete()
            }
          })
          cells.push(cell)
          gridEl.appendChild(cell)
        }

        cells.forEach((cell, index) => paint(index))
        el.append(status, gridEl)
      }
    }
  }
}
