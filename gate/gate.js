import { get } from '../shared/storage.js'
import { hostFromUrl } from '../shared/matcher.js'

const params = new URLSearchParams(location.search)
const target = params.get('target')
const expired = params.get('expired') === '1'

const titleEl = document.getElementById('title')
const subEl = document.getElementById('sub')
const timerEl = document.getElementById('timer')
const countEl = document.getElementById('count')
const btn = document.getElementById('continue')
const optionsLink = document.getElementById('optionsLink')

optionsLink.addEventListener('click', e => {
  e.preventDefault()
  chrome.runtime.openOptionsPage()
})

if (!target) {
  titleEl.textContent = 'Nothing to unlock'
  subEl.textContent = 'Open this from a blocked site, or head to settings.'
  timerEl.hidden = true
  btn.hidden = true
} else {
  const site = hostFromUrl(target) || 'this site'
  titleEl.textContent = `Taking a moment before ${site}`
  if (expired) subEl.textContent = "Time's up — back to it. You've got this."
  else subEl.textContent = 'A short pause, then you can continue.'
  runTimer()
}

async function runTimer() {
  const settings = await get('settings')
  let remaining = settings.timerSec ?? 15
  render(remaining)
  const iv = setInterval(() => {
    remaining -= 1
    render(remaining)
    if (remaining <= 0) {
      clearInterval(iv)
      enable()
    }
  }, 1000)
}

function render(sec) {
  if (sec > 0) {
    countEl.textContent = `${sec}`
    btn.textContent = `Continue in ${sec}s`
  } else {
    countEl.textContent = '✓'
  }
}

function enable() {
  btn.disabled = false
  btn.textContent = 'Continue'
  btn.focus()
}

btn.addEventListener('click', async () => {
  btn.disabled = true
  await chrome.runtime.sendMessage({ type: 'GATE_COMPLETED', target })
  location.href = target
})
