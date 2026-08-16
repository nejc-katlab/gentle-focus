import { test } from 'node:test'
import assert from 'node:assert/strict'
import { msg } from '../shared/messages.js'

test('msg returns the requested tone variant', () => {
  assert.equal(msg('gateHeader', 'encouraging', 'reddit.com'), 'Taking a moment before reddit.com')
  assert.equal(msg('gateHeader', 'minimal', 'reddit.com'), 'reddit.com')
  assert.equal(msg('gateSubExpired', 'neutral'), 'Your time on this site has ended.')
})

test('msg pluralizes the toast', () => {
  assert.equal(msg('toastMinutesLeft', 'encouraging', 1, 'reddit.com'), '1 minute left on reddit.com.')
  assert.equal(msg('toastMinutesLeft', 'encouraging', 3, 'reddit.com'), '3 minutes left on reddit.com.')
})

test('msg falls back to encouraging for an unknown tone', () => {
  assert.equal(msg('oneMoreStep', 'nonsense'), msg('oneMoreStep', 'encouraging'))
})

test('msg returns empty string for an unknown key', () => {
  assert.equal(msg('doesNotExist', 'encouraging'), '')
})
