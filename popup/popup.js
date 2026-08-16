import { addBlockEntry } from '../shared/storage.js'
import { findMatch, hostFromUrl } from '../shared/matcher.js'
import { activeSession, effectiveStrictness } from '../shared/sessions.js'

const CONFIRM_SENTENCE = 'I choose to pause my focus session'

const statusEl = document.getElementById('status')
const hintEl = document.getElementById('hint')
const blockBtn = document.getElementById('blockBtn')
const optionsBtn = document.getElementById('optionsBtn')

const sessionIdle = document.getElementById('sessionIdle')
const sessionActive = document.getElementById('sessionActive')
const sessionStatus = document.getElementById('sessionStatus')
const startSessionToggle = document.getElementById('startSessionToggle')
const sessionForm = document.getElementById('sessionForm')
const sessionChips = document.getElementById('sessionChips')
const sessionCustom = document.getElementById('sessionCustom')
const sessionStrictness = document.getElementById('sessionStrictness')
const startSessionBtn = document.getElementById('startSessionBtn')
const endSessionBtn = document.getElementById('endSessionBtn')

const pauseIdle = document.getElementById('pauseIdle')
const pauseActive = document.getElementById('pauseActive')
const pauseStatus = document.getElementById('pauseStatus')
const pauseToggle = document.getElementById('pauseToggle')
const pauseForm = document.getElementById('pauseForm')
const pauseChips = document.getElementById('pauseChips')
const pauseCustom = document.getElementById('pauseCustom')
const strictConfirm = document.getElementById('strictConfirm')
const confirmSentence = document.getElementById('confirmSentence')
const confirmInput = document.getElementById('confirmInput')
const pauseBtn = document.getElementById('pauseBtn')
const resumeBtn = document.getElementById('resumeBtn')

let selectedSessionMin = null
let selectedPause = null
let strictActive = false

function getState() {
  return new Promise(res => chrome.runtime.sendMessage({ type: 'GET_STATE' }, res))
}

function send(msg) {
  return new Promise(res => chrome.runtime.sendMessage(msg, res))
}

function minsLeft(ts) {
  return Math.max(1, Math.ceil((ts - Date.now()) / 60000))
}

optionsBtn.addEventListener('click', () => chrome.runtime.openOptionsPage())
confirmSentence.textContent = CONFIRM_SENTENCE

async function renderBlockButton(state) {
  const [tab] = await chrome.tabs.query({ active: true, currentWindow: true })
  const url = tab?.url ?? ''
  const host = hostFromUrl(url)
  const isWeb = url.startsWith('http://') || url.startsWith('https://')
  if (!isWeb || !host || findMatch(url, state.blocklist)) {
    blockBtn.hidden = true
    return
  }
  blockBtn.hidden = false
  blockBtn.textContent = `Block ${host}`
  blockBtn.onclick = async () => {
    blockBtn.disabled = true
    await addBlockEntry(host)
    blockBtn.textContent = `${host} blocked`
    hintEl.textContent = 'It will ask for a moment next time you visit.'
  }
}

function renderStatus(state, sess, strictness, paused) {
  if (paused) {
    statusEl.textContent = 'Paused'
    hintEl.textContent = `Resuming in about ${minsLeft(state.pause.expiresAt)} min.`
  } else if (sess) {
    statusEl.textContent = 'Focus session'
    hintEl.textContent = sess.endsAt
      ? `${strictness} · ${minsLeft(sess.endsAt)} min left`
      : `${strictness} · scheduled`
  } else {
    statusEl.textContent = 'Active'
    const count = state.blocklist?.length ?? 0
    hintEl.textContent = `${count} site${count === 1 ? '' : 's'} on your blocklist.`
  }
}

function renderSessionPanel(state, sess) {
  const manual = state.session?.active && sess && sess.endsAt
  sessionActive.hidden = !manual
  sessionIdle.hidden = !!manual
  if (manual) {
    sessionStatus.textContent = `${state.session.strictness} session · ${minsLeft(state.session.endsAt)} min left`
  }
}

function renderPausePanel(paused, state) {
  pauseActive.hidden = !paused
  pauseIdle.hidden = paused
  if (paused) {
    pauseStatus.textContent = `Paused · about ${minsLeft(state.pause.expiresAt)} min left`
  }
}

function updatePauseEnabled() {
  const hasDuration = selectedPause !== null || Number(pauseCustom.value) > 0
  const confirmOk = !strictActive || confirmInput.value.trim() === CONFIRM_SENTENCE
  pauseBtn.disabled = !hasDuration || !confirmOk
}

async function render() {
  const state = await getState()
  const now = new Date()
  const paused = Date.now() < (state.pause?.expiresAt ?? 0)
  const sess = activeSession(state, now)
  const strictness = effectiveStrictness(state, now)
  strictActive = strictness === 'strict'

  renderStatus(state, sess, strictness, paused)
  await renderBlockButton(state)
  renderSessionPanel(state, sess)
  renderPausePanel(paused, state)

  strictConfirm.hidden = !strictActive
  updatePauseEnabled()
}

startSessionToggle.addEventListener('click', () => {
  sessionForm.hidden = !sessionForm.hidden
})

sessionChips.addEventListener('click', e => {
  const chip = e.target.closest('.chip')
  if (!chip) return
  selectedSessionMin = Number(chip.dataset.min)
  sessionCustom.value = ''
  for (const c of sessionChips.children) c.classList.toggle('selected', c === chip)
})

sessionCustom.addEventListener('input', () => {
  selectedSessionMin = null
  for (const c of sessionChips.children) c.classList.remove('selected')
})

startSessionBtn.addEventListener('click', async () => {
  const durationMin = selectedSessionMin ?? Number(sessionCustom.value)
  if (!(durationMin > 0)) return
  await send({ type: 'START_SESSION', durationMin, strictness: sessionStrictness.value })
  render()
})

endSessionBtn.addEventListener('click', async () => {
  await send({ type: 'END_SESSION' })
  render()
})

pauseToggle.addEventListener('click', () => {
  pauseForm.hidden = !pauseForm.hidden
})

pauseChips.addEventListener('click', e => {
  const chip = e.target.closest('.chip')
  if (!chip) return
  selectedPause = chip.dataset.eod ? { eod: true } : { min: Number(chip.dataset.min) }
  pauseCustom.value = ''
  for (const c of pauseChips.children) c.classList.toggle('selected', c === chip)
  updatePauseEnabled()
})

pauseCustom.addEventListener('input', () => {
  selectedPause = null
  for (const c of pauseChips.children) c.classList.remove('selected')
  updatePauseEnabled()
})

confirmInput.addEventListener('input', updatePauseEnabled)

pauseBtn.addEventListener('click', async () => {
  let msg
  if (selectedPause?.eod) msg = { type: 'PAUSE', untilEndOfDay: true }
  else {
    const durationMin = selectedPause?.min ?? Number(pauseCustom.value)
    if (!(durationMin > 0)) return
    msg = { type: 'PAUSE', durationMin }
  }
  await send(msg)
  render()
})

resumeBtn.addEventListener('click', async () => {
  await send({ type: 'RESUME' })
  render()
})

render()
