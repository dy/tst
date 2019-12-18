import { deepEqual as fastDeepEqual } from 'fast-equals'
// TODO: same (members)
// TODO: almost

export function fail (msg) {
  this.log(false, 'fail', msg)
}

export function pass (msg) {
  this.log(true, 'pass', msg)
}

export function ok (value, msg = 'should be truthy') {
  this.log(Boolean(value), 'ok', msg, {
    actual: value,
    expected: true
  })
}

export function notOk (value, msg = 'should be falsy') {
  this.log(!value, 'notOk', msg, {
    actual: value,
    expected: false
  })
}

export function equal (a, b, msg = 'should be equal') {
  this.log(a === b, 'equal', msg, {
    actual: a,
    expected: b
  })
}

export function notEqual (a, b, msg = 'should not be equal') {
  this.log(a !== b, 'notEqual', msg, {
    actual: a,
    expected: b
  })
}

export function deepEqual (a, b, msg = 'should deep equal') {
  this.log(fastDeepEqual(a, b), 'deepEqual', msg, {
    actual: a,
    expected: b
  })
}

export function is(a, b, msg = 'should be the same') {
  this.log(fastDeepEqual(a, b), 'is', msg, {
    actual: a,
    expected: b
  })
}

export function throws (fn, expected, msg = 'should throw') {
  try {
    fn()
    this.log(false, 'throws', msg, {
      expected
    })
  } catch (err) {
    if (expected instanceof Error) {
      this.log(err.name === expected.name, 'throws', msg, {
        actual: err.name,
        expected: expected.name
      })
    } else if (expected instanceof RegExp) {
      this.log(expected.test(err.toString()), 'throws', msg, {
        actual: err.toString(),
        expected: expected
      })
    } else if (typeof expected === 'function') {
      this.log(expected(err), 'throws', msg, {
        actual: err
      })
    } else {
      this.log(true, 'throws', msg)
    }
  }
}
