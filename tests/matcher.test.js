import { test } from 'node:test'
import assert from 'node:assert/strict'
import { detectType, findMatch, hostFromUrl, matchesDomain, matchesPath, normalizeHost, normalizePattern } from '../shared/matcher.js'

test('normalizeHost lowercases and strips www and trailing dot', () => {
  assert.equal(normalizeHost('WWW.Reddit.com'), 'reddit.com')
  assert.equal(normalizeHost('reddit.com.'), 'reddit.com')
  assert.equal(normalizeHost('old.reddit.com'), 'old.reddit.com')
})

test('hostFromUrl extracts normalized host', () => {
  assert.equal(hostFromUrl('https://www.reddit.com/r/all'), 'reddit.com')
  assert.equal(hostFromUrl('http://old.reddit.com'), 'old.reddit.com')
  assert.equal(hostFromUrl('not a url'), null)
})

test('matchesDomain matches domain and subdomains only', () => {
  assert.ok(matchesDomain('reddit.com', 'reddit.com'))
  assert.ok(matchesDomain('www.reddit.com', 'reddit.com'))
  assert.ok(matchesDomain('old.reddit.com', 'reddit.com'))
  assert.ok(!matchesDomain('notreddit.com', 'reddit.com'))
  assert.ok(!matchesDomain('reddit.company.com', 'reddit.com'))
  assert.ok(!matchesDomain('evilreddit.com', 'reddit.com'))
})

test('findMatch returns the matching entry or null', () => {
  const blocklist = [
    { pattern: 'reddit.com', type: 'domain' },
    { pattern: 'youtube.com', type: 'domain' }
  ]
  assert.equal(findMatch('https://old.reddit.com/r/all', blocklist)?.pattern, 'reddit.com')
  assert.equal(findMatch('https://m.youtube.com', blocklist)?.pattern, 'youtube.com')
  assert.equal(findMatch('https://example.com', blocklist), null)
  assert.equal(findMatch('chrome://extensions', blocklist), null)
})

test('detectType picks path when a slash is present', () => {
  assert.equal(detectType('reddit.com'), 'domain')
  assert.equal(detectType('youtube.com/shorts/*'), 'path')
})

test('normalizePattern strips scheme, www, and trailing slashes', () => {
  assert.equal(normalizePattern('  HTTPS://www.Reddit.com/  '), 'reddit.com')
  assert.equal(normalizePattern('www.youtube.com/shorts/*'), 'youtube.com/shorts/*')
  assert.equal(normalizePattern('old.reddit.com'), 'old.reddit.com')
})

test('matchesPath matches only under the glob', () => {
  assert.ok(matchesPath('https://www.youtube.com/shorts/abc123', 'youtube.com/shorts/*'))
  assert.ok(matchesPath('https://m.youtube.com/shorts/xyz', 'youtube.com/shorts/*'))
  assert.ok(!matchesPath('https://www.youtube.com/watch?v=abc', 'youtube.com/shorts/*'))
  assert.ok(!matchesPath('https://vimeo.com/shorts/abc', 'youtube.com/shorts/*'))
})

test('findMatch respects path entries alongside domain entries', () => {
  const blocklist = [
    { pattern: 'youtube.com/shorts/*', type: 'path' }
  ]
  assert.equal(findMatch('https://youtube.com/shorts/abc', blocklist)?.pattern, 'youtube.com/shorts/*')
  assert.equal(findMatch('https://youtube.com/watch?v=abc', blocklist), null)
})

test('findMatch never matches non-web pages (extension, chrome, about)', () => {
  const blocklist = [
    { pattern: 'reddit.com', type: 'domain' },
    { pattern: 'youtube.com/shorts/*', type: 'path' }
  ]
  assert.equal(findMatch('chrome://extensions', blocklist), null)
  assert.equal(findMatch('chrome-extension://abcdef/gate/gate.html?target=x', blocklist), null)
  assert.equal(findMatch('about:blank', blocklist), null)
})

test('path globs match regardless of query string', () => {
  const blocklist = [{ pattern: 'youtube.com/shorts/*', type: 'path' }]
  assert.equal(findMatch('https://www.youtube.com/shorts/abc?feature=share', blocklist)?.pattern, 'youtube.com/shorts/*')
})
