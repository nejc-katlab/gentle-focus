export const STRICTNESS = ['gentle', 'firm', 'strict']

export function strictnessRank(level) {
  const i = STRICTNESS.indexOf(level)
  return i === -1 ? 0 : i
}

export function parseHHMM(value) {
  const [h, m] = String(value).split(':').map(Number)
  if (!Number.isFinite(h) || !Number.isFinite(m)) return null
  return h * 60 + m
}

export function isManualSessionActive(session, now) {
  return !!session?.active && now.getTime() < session.endsAt
}

export function isScheduleActive(schedule, now) {
  if (!schedule?.enabled) return false
  const start = parseHHMM(schedule.start)
  const end = parseHHMM(schedule.end)
  if (start === null || end === null || start === end) return false
  const day = now.getDay()
  const cur = now.getHours() * 60 + now.getMinutes()
  const days = schedule.days ?? []
  if (start < end) {
    return days.includes(day) && cur >= start && cur < end
  }
  const prevDay = (day + 6) % 7
  return (days.includes(day) && cur >= start) || (days.includes(prevDay) && cur < end)
}

export function effectiveStrictness(state, now) {
  let rank = 0
  if (isManualSessionActive(state.session, now)) {
    rank = Math.max(rank, strictnessRank(state.session.strictness))
  }
  for (const schedule of state.schedules ?? []) {
    if (isScheduleActive(schedule, now)) rank = Math.max(rank, strictnessRank(schedule.strictness))
  }
  return STRICTNESS[rank]
}

export function activeSession(state, now) {
  if (isManualSessionActive(state.session, now)) {
    return { strictness: state.session.strictness, endsAt: state.session.endsAt, source: state.session.source }
  }
  for (const schedule of state.schedules ?? []) {
    if (isScheduleActive(schedule, now)) {
      return { strictness: schedule.strictness, endsAt: null, source: `schedule:${schedule.id}` }
    }
  }
  return null
}
