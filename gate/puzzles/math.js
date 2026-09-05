const RANGES = {
  easy: { ops: ['+', '−'], max: 9 },
  medium: { ops: ['+', '−', '×'], max: 12 },
  hard: { ops: ['+', '−', '×'], max: 20 }
}

export function evaluate(a, b, op) {
  if (op === '+') return a + b
  if (op === '−') return a - b
  return a * b
}

export function makeProblem(difficulty, rng = Math.random) {
  const cfg = RANGES[difficulty] ?? RANGES.medium
  const op = cfg.ops[Math.floor(rng() * cfg.ops.length)]
  const cap = op === '×' ? Math.min(cfg.max, 9) : cfg.max
  let a = 1 + Math.floor(rng() * cap)
  let b = 1 + Math.floor(rng() * cap)
  if (op === '−' && b > a) [a, b] = [b, a]
  return { a, b, op, answer: evaluate(a, b, op) }
}

export function isCorrect(input, answer) {
  const norm = String(input).trim()
  if (!norm) return false
  const n = Number(norm)
  return Number.isInteger(n) && n === answer
}

export default {
  id: 'math',
  name: 'Quick sums',
  generate(difficulty) {
    const problem = makeProblem(difficulty)
    return {
      mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.setAttribute('role', 'status')
        status.textContent = 'A little mental math to shift gears.'

        const question = document.createElement('p')
        question.className = 'scrambled'
        question.textContent = `${problem.a} ${problem.op} ${problem.b}`

        const form = document.createElement('form')
        form.className = 'unscramble-form'
        const input = document.createElement('input')
        input.type = 'text'
        input.inputMode = 'numeric'
        input.className = 'unscramble-input'
        input.autocomplete = 'off'
        input.setAttribute('aria-label', 'Your answer')
        const submit = document.createElement('button')
        submit.type = 'submit'
        submit.className = 'puzzle-btn'
        submit.textContent = 'Check'
        form.append(input, submit)

        form.addEventListener('submit', e => {
          e.preventDefault()
          if (isCorrect(input.value, problem.answer)) {
            status.textContent = 'Spot on — nice.'
            input.disabled = true
            submit.disabled = true
            onComplete()
          } else {
            status.textContent = 'Not quite — give it another look.'
            input.select()
          }
        })

        el.append(status, question, form)
        input.focus()
      }
    }
  }
}
