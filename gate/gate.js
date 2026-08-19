import { msg } from '../shared/messages.js'
import { currentStreak } from '../shared/stats.js'
import { enabledPuzzles } from './puzzles/index.js'
import { effectiveStrictness } from '../shared/sessions.js'
import { findMatch, hostFromUrl } from '../shared/matcher.js'
import { get, set, getUsageToday, effectiveDailyCap } from '../shared/storage.js'

const params = new URLSearchParams(location.search)
const target = params.get('target')
const expired = params.get('expired') === '1'

const titleEl = document.getElementById('title')
const subEl = document.getElementById('sub')
const gateStatEl = document.getElementById('gateStat')
const chooserEl = document.getElementById('chooser')
const frictionEl = document.getElementById('friction')
const mountEl = document.getElementById('mount')
const dwellEl = document.getElementById('dwell')
const countEl = document.getElementById('count')
const continueBtn = document.getElementById('continue')
const switchTimerBtn = document.getElementById('switchTimer')
const overrideLink = document.getElementById('overrideLink')
const optionsLink = document.getElementById('optionsLink')
const backdrop = document.getElementById('overrideBackdrop')
const ovDuration = document.getElementById('ovDuration')
const ovBack = document.getElementById('ovBack')
const ovUnlock = document.getElementById('ovUnlock')

const TILE_COPY = {
  timer: { name: 'Wait a timer', desc: 'A short, calm pause.' },
  puzzle: { name: 'Solve a quick puzzle', desc: 'Find the numbers in order.' },
  fact: { name: 'Read a fun fact', desc: 'Learn something, then carry on.' }
}

let settings
let tone = 'encouraging'
let strictness = 'gentle'
let stepsRequired = 1
let stepsDone = 0
let overrideDelaySec = 3
let frictionType = 'timer'

optionsLink.addEventListener('click', e => {
  e.preventDefault()
  chrome.runtime.openOptionsPage()
})

async function main() {
  if (!target) {
    titleEl.textContent = 'Nothing to unlock'
    subEl.textContent = 'Open this from a blocked site, or head to settings.'
    overrideLink.hidden = true
    return
  }

  settings = await get('settings')
  tone = settings.tone ?? 'encouraging'
  const site = hostFromUrl(target) || 'this site'
  renderHeader(site)
  subEl.textContent = expired ? msg('gateSubExpired', tone) : msg('gateSubDefault', tone)

  const [session, schedules] = await Promise.all([get('session'), get('schedules')])
  strictness = effectiveStrictness({ session, schedules }, new Date())
  overrideDelaySec = strictness === 'strict' ? 10 : settings.overrideDelaySec
  setupOverride()
  await showStatLine()

  const blocklist = await get('blocklist')
  const match = findMatch(target, blocklist)
  const usage = await getUsageToday()
  const cap = effectiveDailyCap(match, settings)
  const used = match ? (usage.sites[match.pattern]?.minutes ?? 0) : 0
  if (cap > 0 && used >= cap) {
    titleEl.textContent = `That's your ${site} time for today`
    subEl.textContent = msg('capReached', tone, site, cap)
    return
  }

  if (strictness === 'strict') {
    titleEl.textContent = 'Focus session on'
    subEl.textContent = msg('sessionStrict', tone)
    return
  }

  stepsRequired = strictness === 'firm' ? 2 : 1
  if (strictness === 'firm' && !expired) subEl.textContent = msg('firmTwoSteps', tone)
  beginSelection()
}

function renderHeader(site) {
  const lead = msg('gateHeaderLead', tone)
  titleEl.textContent = ''
  if (lead) titleEl.append(`${lead} `)
  const siteEl = document.createElement('span')
  siteEl.className = 'site-name'
  siteEl.textContent = site
  titleEl.append(siteEl)
}

async function showStatLine() {
  if (!settings.showStatsOnGate) return
  const [overrideLog, stats] = await Promise.all([get('overrideLog'), get('stats')])
  const streak = currentStreak(overrideLog, new Date(), stats.installedOn)
  gateStatEl.textContent = `${streak} day${streak === 1 ? '' : 's'} without an override.`
  gateStatEl.hidden = false
}

function beginSelection() {
  const enabled = Object.keys(settings.gateTypes).filter(k => settings.gateTypes[k])
  const types = enabled.length ? enabled : ['timer']

  if (settings.surpriseMe) startFriction(types[Math.floor(Math.random() * types.length)])
  else if (types.length === 1) startFriction(types[0])
  else showChooser(types)
}

function startNextStep() {
  subEl.textContent = msg('oneMoreStep', tone)
  frictionEl.hidden = true
  chooserEl.hidden = true
  chooserEl.innerHTML = ''
  mountEl.innerHTML = ''
  dwellEl.hidden = true
  switchTimerBtn.hidden = true
  continueBtn.textContent = 'Continue'
  beginSelection()
}

function showChooser(types) {
  chooserEl.hidden = false
  for (const type of types) {
    const copy = TILE_COPY[type]
    const tile = document.createElement('button')
    tile.type = 'button'
    tile.className = 'tile'
    const name = document.createElement('span')
    name.className = 'tile-name'
    name.textContent = copy.name
    const desc = document.createElement('span')
    desc.className = 'tile-desc'
    desc.textContent = copy.desc
    tile.append(name, desc)
    tile.addEventListener('click', () => {
      chooserEl.hidden = true
      startFriction(type)
    })
    chooserEl.appendChild(tile)
  }
}

function startFriction(type) {
  frictionType = type
  frictionEl.hidden = false
  continueBtn.disabled = true
  if (type === 'timer') runTimer(settings.timerSec)
  else if (type === 'fact') runFact()
  else if (type === 'puzzle') runPuzzle()
}

function enableContinue() {
  continueBtn.disabled = false
  continueBtn.textContent = 'Continue'
  continueBtn.focus()
}

function runDwell(seconds, onDone) {
  dwellEl.hidden = false
  let remaining = Number(seconds)
  if (!Number.isFinite(remaining) || remaining < 0) remaining = 0
  remaining = Math.floor(remaining)
  const tick = () => {
    countEl.textContent = remaining > 0 ? String(remaining) : '✓'
  }
  tick()
  const iv = setInterval(() => {
    remaining -= 1
    tick()
    if (remaining <= 0) {
      clearInterval(iv)
      onDone()
    }
  }, 1000)
}

async function runTimer(sec) {
  await showQuote()
  dwellEl.classList.add('breathing')
  runDwell(sec ?? 15, () => {
    dwellEl.classList.remove('breathing')
    enableContinue()
  })
}

async function showQuote() {
  try {
    const res = await fetch(chrome.runtime.getURL('data/quotes.json'))
    const quotes = await res.json()
    const quote = quotes[Math.floor(Math.random() * quotes.length)]
    mountEl.innerHTML = ''
    const text = document.createElement('p')
    text.className = 'quote'
    text.textContent = `“${quote.text}”`
    mountEl.append(text)
    if (quote.author) {
      const author = document.createElement('p')
      author.className = 'quote-author'
      author.textContent = `— ${quote.author}`
      mountEl.append(author)
    }
  } catch {}
}

async function runFact() {
  const fact = await pickFact()
  mountEl.innerHTML = ''
  const cat = document.createElement('p')
  cat.className = 'fact-cat'
  cat.textContent = fact.category
  const text = document.createElement('p')
  text.className = 'fact'
  text.textContent = fact.text
  mountEl.append(cat, text)
  runDwell(settings.factDwellSec ?? 20, enableContinue)
}

async function pickFact() {
  const res = await fetch(chrome.runtime.getURL('data/facts.json'))
  const facts = await res.json()
  let seen = await get('factsSeen')
  let pool = facts.filter(f => !seen.includes(f.id))
  if (pool.length === 0) {
    pool = facts
    seen = []
  }
  const fact = pool[Math.floor(Math.random() * pool.length)]
  await set('factsSeen', [...seen, fact.id])
  return fact
}

function runPuzzle() {
  const options = enabledPuzzles(settings)
  const module = options[Math.floor(Math.random() * options.length)]
  const puzzle = module.generate(settings.difficulty)
  puzzle.mount(mountEl, enableContinue)
  switchTimerBtn.hidden = false
  switchTimerBtn.onclick = () => {
    switchTimerBtn.hidden = true
    mountEl.innerHTML = ''
    continueBtn.disabled = true
    continueBtn.textContent = 'Continue'
    runTimer(settings.timerSec)
  }
}

continueBtn.addEventListener('click', async () => {
  continueBtn.disabled = true
  stepsDone += 1
  if (stepsDone < stepsRequired) {
    startNextStep()
    return
  }
  await chrome.runtime.sendMessage({ type: 'GATE_COMPLETED', target, friction: frictionType })
  location.href = target
})

function setupOverride() {
  ovDuration.value = String(settings.overrideDefaultMin ?? 15)
  overrideLink.addEventListener('click', e => {
    e.preventDefault()
    openOverride()
  })
  ovBack.addEventListener('click', closeOverride)
  backdrop.addEventListener('click', e => {
    if (e.target === backdrop) closeOverride()
  })
  ovUnlock.addEventListener('click', async () => {
    ovUnlock.disabled = true
    const durationMin = Number(ovDuration.value)
    await chrome.runtime.sendMessage({ type: 'OVERRIDE_REQUESTED', target, durationMin })
    location.href = target
  })
}

let ovTimer
function openOverride() {
  backdrop.hidden = false
  let remaining = Number(overrideDelaySec)
  if (!Number.isFinite(remaining) || remaining < 0) remaining = 3
  remaining = Math.floor(remaining)
  const tick = () => {
    ovUnlock.textContent = remaining > 0 ? `I understand — unlock (${remaining})` : 'I understand — unlock'
  }
  clearInterval(ovTimer)
  if (remaining === 0) {
    ovUnlock.disabled = false
    tick()
    return
  }
  ovUnlock.disabled = true
  tick()
  ovTimer = setInterval(() => {
    remaining -= 1
    tick()
    if (remaining <= 0) {
      clearInterval(ovTimer)
      ovUnlock.disabled = false
    }
  }, 1000)
}

function closeOverride() {
  backdrop.hidden = true
  clearInterval(ovTimer)
}

document.addEventListener('keydown', e => {
  if (e.key === 'Escape' && !backdrop.hidden) closeOverride()
})

main()
