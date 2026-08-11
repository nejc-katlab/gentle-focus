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

export function matchesDomain(host, pattern) {
  const h = normalizeHost(host)
  const p = normalizeHost(pattern)
  return h === p || h.endsWith('.' + p)
}

export function findMatch(url, blocklist) {
  const host = hostFromUrl(url)
  if (!host) return null
  for (const entry of blocklist) {
    if (entry.type === 'domain' && matchesDomain(host, entry.pattern)) return entry
  }
  return null
}
