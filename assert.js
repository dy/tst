/**
 * Standalone assertions - no dependency on test runner
 *
 * Each assertion:
 * - Returns true on success
 * - Throws Assertion error on failure
 * - Works anywhere (inside or outside tests)
 */

export class Assertion extends Error {
  constructor(opts = {}) {
    super(opts.message)
    if (Error.captureStackTrace) Error.captureStackTrace(this, this.constructor)
    this.operator = opts.operator
    this.expected = opts.expected
    this.actual = opts.actual
  }
}
Assertion.prototype.name = 'Assertion'

// Hook for test runner to capture passes
let hook = null
export function onPass(fn) { hook = fn }

function report(op, msg) {
  hook?.({ operator: op, message: msg })
  return true
}

// Deep or primitive equality
const eq = (a, b) => isPrimitive(a) || isPrimitive(b) ? Object.is(a, b) : deq(a, b)

export function ok(value, msg = 'should be truthy') {
  if (value) return report('ok', msg)
  throw new Assertion({ operator: 'ok', message: msg, actual: value, expected: true })
}

export function is(a, b, msg = 'should be equal') {
  if (eq(a, b)) return report('is', msg)
  throw new Assertion({ operator: 'is', message: msg, actual: slice(a), expected: slice(b) })
}

export function not(a, b, msg = 'should differ') {
  if (!eq(a, b)) return report('not', msg)
  throw new Assertion({ operator: 'not', message: msg, actual: slice(a), expected: slice(b) })
}

export function same(a, b, msg = 'should have same members') {
  if (sameMembers(a, b)) return report('same', msg)
  throw new Assertion({ operator: 'same', message: msg, actual: a, expected: b })
}

export function any(a, list, msg = 'should be one of') {
  if (list.some(b => eq(a, b))) return report('any', msg)
  throw new Assertion({ operator: 'any', message: msg, actual: slice(a), expected: list.map(slice) })
}

export function throws(fn, expected, msg = 'should throw') {
  try {
    fn()
    throw new Assertion({ operator: 'throws', message: msg, expected })
  } catch (err) {
    if (err instanceof Assertion) throw err

    if (expected instanceof Error) {
      if (err.name === expected.name) return report('throws', msg)
      throw new Assertion({ operator: 'throws', message: msg, actual: err.name, expected: expected.name })
    }
    if (expected instanceof RegExp) {
      if (expected.test(err.toString())) return report('throws', msg)
      throw new Assertion({ operator: 'throws', message: msg, actual: err.toString(), expected })
    }
    if (typeof expected === 'function') {
      if (expected(err)) return report('throws', msg)
      throw new Assertion({ operator: 'throws', message: msg, actual: err })
    }
    return report('throws', msg)
  }
}

export async function rejects(fn, expected, msg = 'should reject') {
  try {
    await fn()
    throw new Assertion({ operator: 'rejects', message: msg, expected })
  } catch (err) {
    if (err instanceof Assertion) throw err

    if (expected instanceof Error) {
      if (err.name === expected.name) return report('rejects', msg)
      throw new Assertion({ operator: 'rejects', message: msg, actual: err.name, expected: expected.name })
    }
    if (expected instanceof RegExp) {
      if (expected.test(err.toString())) return report('rejects', msg)
      throw new Assertion({ operator: 'rejects', message: msg, actual: err.toString(), expected })
    }
    if (typeof expected === 'function') {
      if (expected(err)) return report('rejects', msg)
      throw new Assertion({ operator: 'rejects', message: msg, actual: err })
    }
    return report('rejects', msg)
  }
}

export function almost(a, b, eps = 1.19209290e-7, msg = 'should almost equal') {
  if (isPrimitive(a) || isPrimitive(b) ? almostEqual(a, b, eps) :
    [...a].every((a0, i) => a0 === b[i] || almostEqual(a0, b[i], eps)))
    return report('almost', msg)
  throw new Assertion({ operator: 'almost', message: msg, actual: slice(a), expected: slice(b) })
}

// Convenience: explicit pass/fail
export function pass(msg) { return report('pass', msg) }
export function fail(msg) { throw new Assertion({ operator: 'fail', message: msg }) }

// ─────────────────────────────────────────────────────────────────────────────
// Helpers
// ─────────────────────────────────────────────────────────────────────────────

function deq(a, b) {
  if (a === b) return true
  if (a && b) {
    if (a.constructor === b.constructor) {
      if (a.constructor === RegExp) return a.toString() === b.toString()
      if (a.constructor === Date) return a.getTime() === b.getTime()
      if (a.constructor === Array) return a.length === b.length && a.every((a, i) => deq(a, b[i]))
      if (a.constructor === Object) return Object.keys(a).length === Object.keys(b).length && Object.keys(a).every(key => deq(a[key], b[key]))
    }
    if (!isPrimitive(a) && a[Symbol.iterator] && b[Symbol.iterator]) return deq([...a], [...b])
  }
  return a !== a && b !== b
}

function isPrimitive(val) {
  if (typeof val === 'object') return val === null
  return typeof val !== 'function'
}

function almostEqual(a, b, eps) {
  if (eps === undefined) {
    eps = Math.min(Math.max(
      Math.abs(a - new Float32Array([a])[0]),
      Math.abs(b - new Float32Array([b])[0])
    ), 1.19209290e-7)
  }
  return Math.abs(a - b) <= eps || a === b
}

function sameMembers(a, b) {
  a = Array.from(a)
  b = Array.from(b)
  if (a.length !== b.length) return false
  for (const item of b) {
    const idx = a.indexOf(item)
    if (idx < 0) return false
    a.splice(idx, 1)
  }
  return a.length === 0
}

const slice = a => isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a)
