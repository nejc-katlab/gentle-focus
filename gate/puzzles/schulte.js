const SIZES = { easy: 4, medium: 5, hard: 6 }

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function buildOrder(difficulty) {
  const size = SIZES[difficulty] ?? 5
  const order = shuffle(Array.from({ length: size * size }, (_, i) => i + 1))
  return { size, order }
}

export default {
  id: 'schulte',
  name: 'Find the numbers',
  generate(difficulty) {
    const { size, order } = buildOrder(difficulty)
    const count = size * size
    let next = 1

    return {
      mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.textContent = 'Tap the numbers in order, starting at 1.'

        const grid = document.createElement('div')
        grid.className = 'schulte'
        grid.style.setProperty('--n', size)

        for (const n of order) {
          const cell = document.createElement('button')
          cell.type = 'button'
          cell.className = 'schulte-cell'
          cell.textContent = String(n)
          cell.setAttribute('aria-label', `Number ${n}`)
          cell.addEventListener('click', () => {
            if (n === next) {
              cell.classList.add('done')
              cell.disabled = true
              next += 1
              if (next > count) {
                status.textContent = 'Nicely done.'
                onComplete()
              } else {
                status.textContent = `Next: ${next}`
              }
            } else {
              cell.classList.add('wrong')
              setTimeout(() => cell.classList.remove('wrong'), 300)
            }
          })
          grid.appendChild(cell)
        }

        el.append(status, grid)
      }
    }
  }
}
