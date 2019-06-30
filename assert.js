import { log } from './index.js'


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
  if (a === b) return
  if ('length' in a) {
    if (a.length !== b.length) return log(false, 'deepEqual', msg, {
      actual: '<length ' + a.length + '>',
      expected: '<length ' + b.length + '>'
    })

    for (let i = 0; i < a.length; i++) {
      if (a[i] !== b[i]) {
        return log(false, 'deepEqual', msg, {
          actual: a,
          expected: b,
          index: i
        })
      }
    }
  }
  else {
    for (let prop in a) {
      if (a[prop] !== b[prop]) {
        return log (false, 'deepEqual', msg, {
          actual: a,
          expected: b,
          prop
        })
      }
    }
    for (let prop in b) {
      if (a[prop] !== b[prop]) {
        return log (false, 'deepEqual', msg, {
          actual: a,
          expected: b,
          prop
        })
      }
    }
  }
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

// alias
export {
  notOk as nok,
  equal as eq,
  notEqual as neq,
  deepEqual as deq,
  throws as err
}
