/**
 * Demo: shows tst API usage
 * Run: node demo.js (or open index.html in browser)
 *
 * This is NOT the test suite - see test.js for actual tests.
 */
import test, { ok, is, not, any, same, throws, formats } from './tst.js'

// ─────────────────────────────────────────────────────────────────────────────
// Basic assertions
// ─────────────────────────────────────────────────────────────────────────────

test('ok - truthy check', () => {
  ok(true)
  ok(1)
  ok('non-empty string')
  ok([])  // arrays are truthy
  ok({})  // objects are truthy
})

test('is - equality check', () => {
  // Primitives use Object.is
  is(1, 1)
  is('hello', 'hello')
  is(null, null)
  is(NaN, NaN)  // Object.is(NaN, NaN) === true

  // Objects use deep equality
  is([1, 2, 3], [1, 2, 3])
  is({ a: 1, b: 2 }, { b: 2, a: 1 })  // key order doesn't matter
  is([{ x: 1 }], [{ x: 1 }])  // nested
})

test('not - inequality check', () => {
  not(1, 2)
  not([1], [2])
  not({ a: 1 }, { a: 2 })
})

test('any - one of options', () => {
  any(2, [1, 2, 3])
  any('b', ['a', 'b', 'c'])
  any([1], [[1], [2], [3]])  // deep equality
})

test('same - same members (order independent)', () => {
  same([1, 2, 3], [3, 1, 2])
  same(['a', 'b'], ['b', 'a'])
})

test('throws - error checking', () => {
  throws(() => { throw new Error('boom') })
  throws(() => { throw new Error('boom') }, /boom/)
  throws(() => { throw new TypeError() }, TypeError)
})

// ─────────────────────────────────────────────────────────────────────────────
// Async tests
// ─────────────────────────────────────────────────────────────────────────────

test('async test', async () => {
  await new Promise(r => setTimeout(r, 100))
  ok(true)
})

test('async with timeout', { timeout: 2000 }, async () => {
  await new Promise(r => setTimeout(r, 500))
  ok(true)
})

// ─────────────────────────────────────────────────────────────────────────────
// Test modifiers
// ─────────────────────────────────────────────────────────────────────────────

test.skip('skipped test', () => {
  ok(false)  // won't run
})

test.todo('future feature')  // no callback = todo

test.mute('muted test (assertions hidden)', () => {
  ok(true)
  ok(true)
  is(1, 1)
  // In node: shows "► muted test (3 assertions)"
  // In browser: collapsed group
})

// ─────────────────────────────────────────────────────────────────────────────
// Manual pass/fail callbacks (legacy API)
// ─────────────────────────────────────────────────────────────────────────────

test('pass callback', (pass) => {
  pass('custom pass message')
})
