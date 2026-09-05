const LENGTHS = { easy: 3, medium: 4, hard: 5 }
const PADS = 4

export function makeSequence(length, pads = PADS, rng = Math.random) {
  return Array.from({ length }, () => Math.floor(rng() * pads))
}

export function checkInput(sequence, input) {
  for (let i = 0; i < input.length; i++) {
    if (input[i] !== sequence[i]) return 'wrong'
  }
  return input.length === sequence.length ? 'complete' : 'partial'
}

export default {
  id: 'memory',
  name: 'Repeat the pattern',
  generate(difficulty) {
    const length = LENGTHS[difficulty] ?? 4
    const sequence = makeSequence(length)
    return {
      mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.setAttribute('role', 'status')
        status.textContent = 'Watch the pattern…'

        const grid = document.createElement('div')
        grid.className = 'memory'

        const pads = []
        for (let i = 0; i < PADS; i++) {
          const pad = document.createElement('button')
          pad.type = 'button'
          pad.className = 'memory-pad'
          pad.setAttribute('aria-label', `Pad ${i + 1}`)
          pads.push(pad)
          grid.appendChild(pad)
        }

        let input = []
        let accepting = false

        const light = (index, on) => pads[index].classList.toggle('lit', on)

        const playback = () => {
          accepting = false
          input = []
          for (const pad of pads) pad.disabled = true
          status.textContent = 'Watch the pattern…'
          let step = 0
          const show = () => {
            if (step >= sequence.length) {
              status.textContent = 'Now your turn — repeat it.'
              for (const pad of pads) pad.disabled = false
              accepting = true
              return
            }
            const idx = sequence[step]
            light(idx, true)
            setTimeout(() => {
              light(idx, false)
              step++
              setTimeout(show, 220)
            }, 480)
          }
          setTimeout(show, 500)
        }

        pads.forEach((pad, index) => {
          pad.addEventListener('click', () => {
            if (!accepting) return
            input.push(index)
            light(index, true)
            setTimeout(() => light(index, false), 180)
            const result = checkInput(sequence, input)
            if (result === 'wrong') {
              accepting = false
              status.textContent = 'Close — watch once more.'
              setTimeout(playback, 700)
            } else if (result === 'complete') {
              accepting = false
              status.textContent = 'Perfect recall — nice.'
              for (const p of pads) p.disabled = true
              onComplete()
            }
          })
        })

        el.append(status, grid)
        playback()
      }
    }
  }
}
