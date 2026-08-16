const SIZES = { easy: 3, medium: 3, hard: 4 }

function shuffle(arr, rng) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(rng() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function countInversions(tiles) {
  const arr = tiles.filter(n => n !== 0)
  let inv = 0
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (arr[i] > arr[j]) inv++
    }
  }
  return inv
}

export function isSolvable(tiles, size) {
  const inv = countInversions(tiles)
  if (size % 2 === 1) return inv % 2 === 0
  const blankRowFromBottom = size - Math.floor(tiles.indexOf(0) / size)
  return blankRowFromBottom % 2 === 0 ? inv % 2 === 1 : inv % 2 === 0
}

export function isSolved(tiles) {
  for (let i = 0; i < tiles.length - 1; i++) {
    if (tiles[i] !== i + 1) return false
  }
  return tiles[tiles.length - 1] === 0
}

export function generateSolvable(size, rng = Math.random) {
  const n = size * size
  let tiles
  do {
    tiles = shuffle(Array.from({ length: n }, (_, i) => i), rng)
  } while (!isSolvable(tiles, size) || isSolved(tiles))
  return tiles
}

export default {
  id: 'slide',
  name: 'Sliding tiles',
  generate(difficulty) {
    const size = SIZES[difficulty] ?? 3
    const tiles = generateSolvable(size)

    return {
      mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.textContent = 'Slide the tiles into order, blank last.'

        const grid = document.createElement('div')
        grid.className = 'slide'
        grid.style.setProperty('--n', size)

        const render = () => {
          grid.innerHTML = ''
          tiles.forEach((value, index) => {
            const cell = document.createElement('button')
            cell.type = 'button'
            if (value === 0) {
              cell.className = 'slide-cell slide-blank'
              cell.disabled = true
            } else {
              cell.className = 'slide-cell'
              cell.textContent = String(value)
              cell.setAttribute('aria-label', `Tile ${value}`)
              cell.addEventListener('click', () => tryMove(index))
            }
            grid.appendChild(cell)
          })
        }

        const tryMove = index => {
          const blank = tiles.indexOf(0)
          const r1 = Math.floor(index / size)
          const c1 = index % size
          const r2 = Math.floor(blank / size)
          const c2 = blank % size
          const adjacent = (r1 === r2 && Math.abs(c1 - c2) === 1) || (c1 === c2 && Math.abs(r1 - r2) === 1)
          if (!adjacent) return
          tiles[blank] = tiles[index]
          tiles[index] = 0
          render()
          if (isSolved(tiles)) {
            status.textContent = 'Solved — well done.'
            onComplete()
          }
        }

        render()
        el.append(status, grid)
      }
    }
  }
}
