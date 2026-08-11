import { test } from 'node:test'
import assert from 'node:assert/strict'
import { findMatch, hostFromUrl, matchesDomain, normalizeHost } from '../shared/matcher.js'

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
