const MESSAGES = {
  gateHeader: {
    encouraging: s => `Taking a moment before ${s}`,
    neutral: s => `Pause before ${s}`,
    minimal: s => s
  },
  gateHeaderLead: {
    encouraging: 'Taking a moment before',
    neutral: 'Pause before',
    minimal: ''
  },
  gateSubDefault: {
    encouraging: 'A short pause, then you can continue.',
    neutral: 'Complete a step to continue.',
    minimal: ''
  },
  gateSubExpired: {
    encouraging: "Time's up — back to it. You've got this.",
    neutral: 'Your time on this site has ended.',
    minimal: 'Time up.'
  },
  capReached: {
    encouraging: (s, cap) => `That's your ${s} time for today — the ${cap} minutes you set aside. The override below is here if you truly need it.`,
    neutral: (s, cap) => `Daily cap reached for ${s} (${cap} min). The override below is available.`,
    minimal: s => `Cap reached for ${s}.`
  },
  sessionStrict: {
    encouraging: 'A strict session is running, so the gate stays closed. The override below is here if you truly need it.',
    neutral: 'Strict focus session active. Only the override is available.',
    minimal: 'Strict session — override only.'
  },
  firmTwoSteps: {
    encouraging: 'Focus session on — two quick steps to continue.',
    neutral: 'Firm session: two steps required.',
    minimal: 'Two steps.'
  },
  oneMoreStep: {
    encouraging: 'One more step.',
    neutral: 'One step remaining.',
    minimal: 'One more.'
  },
  toastMinutesLeft: {
    encouraging: (m, s) => `${m} minute${m === 1 ? '' : 's'} left on ${s}.`,
    neutral: (m, s) => `${m} minute${m === 1 ? '' : 's'} remaining on ${s}.`,
    minimal: (m, s) => `${m}m left · ${s}`
  },
  sessionEndTitle: {
    encouraging: 'Session done — nice work.',
    neutral: 'Focus session ended.',
    minimal: 'Session ended.'
  },
  sessionEndBody: {
    encouraging: 'Your focus session has finished.',
    neutral: 'Your focus session has finished.',
    minimal: ''
  }
}

export function msg(key, tone, ...args) {
  const entry = MESSAGES[key]
  if (!entry) return ''
  const variant = entry[tone] ?? entry.encouraging
  return typeof variant === 'function' ? variant(...args) : variant
}
