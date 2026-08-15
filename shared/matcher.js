export function normalizeHost(host) {
  const h = String(host).toLowerCase().replace(/\.$/, '')
  return h.startsWith('www.') ? h.slice(4) : h
}

export function hostFromUrl(url) {
  try {
    return normalizeHost(new URL(url).hostname)
  } catch {
    return null
  }
}

export function detectType(pattern) {
  return String(pattern).includes('/') ? 'path' : 'domain'
}

export function normalizePattern(raw) {
  let p = String(raw).trim().toLowerCase()
  p = p.replace(/^https?:\/\//, '')
  p = p.replace(/^www\./, '')
  p = p.replace(/\/+$/, '')
  return p
}

export function matchesDomain(host, pattern) {
  const h = normalizeHost(host)
  const p = normalizeHost(pattern)
  return h === p || h.endsWith('.' + p)
}

function globToRegExp(glob) {
  const escaped = glob.replace(/[.+?^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*')
  return new RegExp('^' + escaped)
}

export function matchesPath(url, pattern) {
  const slash = pattern.indexOf('/')
  if (slash === -1) return false
  const domainPart = pattern.slice(0, slash)
  const pathGlob = pattern.slice(slash)
  let parsed
  try {
    parsed = new URL(url)
  } catch {
    return false
  }
  if (!matchesDomain(parsed.hostname, domainPart)) return false
  return globToRegExp(pathGlob).test(parsed.pathname)
}

export function findMatch(url, blocklist) {
  const host = hostFromUrl(url)
  if (!host) return null
  for (const entry of blocklist) {
    if (entry.type === 'path') {
      if (matchesPath(url, entry.pattern)) return entry
    } else if (matchesDomain(host, entry.pattern)) {
      return entry
    }
  }
  return null
}
