/**
 * Demo: shows tst API usage
 * Run: node demo.js (or open index.html in browser)
 *
 * This is NOT the test suite - see test.js for actual tests.
 */
import test from './tst.js'

// ─────────────────────────────────────────────────────────────────────────────
// Basic assertions (passed as parameter)
// ─────────────────────────────────────────────────────────────────────────────

test('ok - truthy check', ({ ok }) => {
  ok(true)
  ok(1)
  ok('non-empty string')
  ok([])  // arrays are truthy
  ok({})  // objects are truthy
})

test('is - equality check', ({ is }) => {
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

test('not - inequality check', ({ not }) => {
  not(1, 2)
  not([1], [2])
  not({ a: 1 }, { a: 2 })
})

test('any - one of options', ({ any }) => {
  any(2, [1, 2, 3])
  any('b', ['a', 'b', 'c'])
  any([1], [[1], [2], [3]])  // deep equality
})

test('same - same members (order independent)', ({ same }) => {
  same([1, 2, 3], [3, 1, 2])
  same(['a', 'b'], ['b', 'a'])
})

test('throws - error checking', ({ throws }) => {
  throws(() => { throw new Error('boom') })
  throws(() => { throw new Error('boom') }, /boom/)
  throws(() => { throw new TypeError() }, TypeError)
})

// ─────────────────────────────────────────────────────────────────────────────
// Async tests
// ─────────────────────────────────────────────────────────────────────────────

test('async test', async ({ ok }) => {
  await new Promise(r => setTimeout(r, 100))
  ok(true)
})

test('async with timeout', { timeout: 2000 }, async ({ ok }) => {
  await new Promise(r => setTimeout(r, 500))
  ok(true)
})

// ─────────────────────────────────────────────────────────────────────────────
// Test modifiers
// ─────────────────────────────────────────────────────────────────────────────

test.skip('skipped test', ({ ok }) => {
  ok(false)  // won't run
})

test.todo('future feature')  // no callback = todo

test.mute('muted test (assertions hidden)', ({ ok, is }) => {
  ok(true)
  ok(true)
  is(1, 1)
  // In node: shows "► muted test (3 assertions)"
  // In browser: collapsed group
})

// ─────────────────────────────────────────────────────────────────────────────
// Demo mode - failures don't affect exit code
// ─────────────────────────────────────────────────────────────────────────────

test.demo('experimental feature', ({ ok }) => {
  ok(true)  // this runs, failures here won't fail the whole suite
})

// ─────────────────────────────────────────────────────────────────────────────
// Fork mode - isolated worker thread (benchmarking, isolation)
// ─────────────────────────────────────────────────────────────────────────────

test.fork('isolated computation', ({ is }) => {
  // Runs in separate thread (Worker)
  // Useful for: benchmarks, CPU-intensive tests, isolation
  let sum = 0
  for (let i = 0; i < 1e6; i++) sum += i
  is(sum, 499999500000, 'computed in isolate')
})

test.fork('async in worker', { mute:true }, async ({ ok, is }) => {
  await new Promise(r => setTimeout(r, 50))
  ok(true, 'async works in fork')
  is([1, 2], [1, 2], 'assertions available')
})

test.skip('async in worker 2', { fork:true }, async ({ ok, is }) => {
  await new Promise(r => setTimeout(r, 50))
  ok(true, 'async works in fork')
  is([1, 2], [1, 2], 'assertions available')
})
