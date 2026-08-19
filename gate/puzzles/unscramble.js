const LENGTHS = { easy: [5], medium: [6, 7], hard: [8] }

export function sortedLetters(word) {
  return String(word).toLowerCase().split('').sort().join('')
}

function shuffle(arr) {
  for (let i = arr.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[arr[i], arr[j]] = [arr[j], arr[i]]
  }
  return arr
}

export function scramble(word, shuffleFn = shuffle) {
  let out = shuffleFn(word.split('')).join('')
  if (out === word && new Set(word).size > 1) out = word.slice(1) + word[0]
  return out
}

export function isValidAnswer(input, letters, wordset) {
  const norm = String(input).trim().toLowerCase()
  if (!norm) return false
  return wordset.has(norm) && sortedLetters(norm) === sortedLetters(letters)
}

export default {
  id: 'unscramble',
  name: 'Unscramble a word',
  generate(difficulty) {
    const lengths = LENGTHS[difficulty] ?? [6, 7]
    return {
      async mount(el, onComplete) {
        el.innerHTML = ''
        const status = document.createElement('p')
        status.className = 'puzzle-status'
        status.setAttribute('role', 'status')
        status.textContent = 'Loading…'
        el.appendChild(status)

        const res = await fetch(chrome.runtime.getURL('data/wordlist.json'))
        const words = await res.json()
        const wordset = new Set(words)
        const pool = words.filter(w => lengths.includes(w.length))
        const word = pool[Math.floor(Math.random() * pool.length)]
        const scrambled = scramble(word)

        status.textContent = 'Rearrange the letters into a word.'

        const letters = document.createElement('p')
        letters.className = 'scrambled'
        letters.textContent = scrambled.toUpperCase().split('').join(' ')

        const form = document.createElement('form')
        form.className = 'unscramble-form'
        const input = document.createElement('input')
        input.type = 'text'
        input.className = 'unscramble-input'
        input.autocomplete = 'off'
        input.spellcheck = false
        input.setAttribute('aria-label', 'Your word')
        const submit = document.createElement('button')
        submit.type = 'submit'
        submit.className = 'puzzle-btn'
        submit.textContent = 'Check'
        form.append(input, submit)

        form.addEventListener('submit', e => {
          e.preventDefault()
          if (isValidAnswer(input.value, scrambled, wordset)) {
            status.textContent = 'That works — nice.'
            input.disabled = true
            submit.disabled = true
            onComplete()
          } else {
            status.textContent = 'Not quite — try another arrangement.'
            input.select()
          }
        })

        el.append(letters, form)
        input.focus()
      }
    }
  }
}
