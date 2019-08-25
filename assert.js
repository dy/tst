import fastDeepEqual from 'fast-deep-equal'
import { log } from './index.js'

// TODO: same (members)
// TODO: almost

export function fail (msg) {
  log(false, 'fail', msg)
}

export function pass (msg) {
  log(true, 'pass', msg)
}

export function ok (value, msg = 'should be truthy') {
  log(Boolean(value), 'ok', msg, {
    actual: value,
    expected: true
  })
}

export function notOk (value, msg = 'should be falsy') {
  log(!value, 'notOk', msg, {
    actual: value,
    expected: false
  })
}

export function equal (a, b, msg = 'should be equal') {
  log(a === b, 'equal', msg, {
    actual: a,
    expected: b
  })
}

export function notEqual (a, b, msg = 'should not be equal') {
  log(a !== b, 'notEqual', msg, {
    actual: a,
    expected: b
  })
}

export function deepEqual (a, b, msg = 'should deep equal') {
  log(fastDeepEqual(a, b), 'deepEqual', msg, {
    actual: a,
    expected: b
  })
}

export function is(a, b, msg = 'should be the same') {
  log(fastDeepEqual(a, b), 'is', msg, {
    actual: a,
    expected: b
  })
}

export function throws (fn, expected, msg = 'should throw') {
  try {
    fn()
    log(false, 'throws', msg, {
      expected
    })
  } catch (err) {
    if (expected instanceof Error) {
      log(err.name === expected.name, 'throws', msg, {
        actual: err.name,
        expected: expected.name
      })
    } else if (expected instanceof RegExp) {
      log(expected.test(err.toString()), 'throws', msg, {
        actual: err.toString(),
        expected: expected
      })
    } else if (typeof expected === 'function') {
      log(expected(err), 'throws', msg, {
        actual: err
      })
    } else {
      throw new Error(`Second argument to t.throws must be an Error constructor, regex, or function`)
    }
  }
}

