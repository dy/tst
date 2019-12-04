let fastDeepEqual = require('fast-deep-equal')
let test = require('./index.js')

// TODO: same (members)
// TODO: almost

module.exports.fail = function fail (msg) {
  test.log(false, 'fail', msg)
}

module.exports.pass = function pass (msg) {
  test.log(true, 'pass', msg)
}

module.exports.ok = function ok (value, msg = 'should be truthy') {
  test.log(Boolean(value), 'ok', msg, {
    actual: value,
    expected: true
  })
}

module.exports.notOk = function notOk (value, msg = 'should be falsy') {
  test.log(!value, 'notOk', msg, {
    actual: value,
    expected: false
  })
}

module.exports.equal = function equal (a, b, msg = 'should be equal') {
  test.log(a === b, 'equal', msg, {
    actual: a,
    expected: b
  })
}

module.exports.notEqual = function notEqual (a, b, msg = 'should not be equal') {
  test.log(a !== b, 'notEqual', msg, {
    actual: a,
    expected: b
  })
}

module.exports.deepEqual = function deepEqual (a, b, msg = 'should deep equal') {
  test.log(fastDeepEqual(a, b), 'deepEqual', msg, {
    actual: a,
    expected: b
  })
}

module.exports.is = function is(a, b, msg = 'should be the same') {
  test.log(fastDeepEqual(a, b), 'is', msg, {
    actual: a,
    expected: b
  })
}

module.exports.throws = function throws (fn, expected, msg = 'should throw') {
  try {
    fn()
    test.log(false, 'throws', msg, {
      expected
    })
  } catch (err) {
    if (expected instanceof Error) {
      test.log(err.name === expected.name, 'throws', msg, {
        actual: err.name,
        expected: expected.name
      })
    } else if (expected instanceof RegExp) {
      test.log(expected.test(err.toString()), 'throws', msg, {
        actual: err.toString(),
        expected: expected
      })
    } else if (typeof expected === 'function') {
      test.log(expected(err), 'throws', msg, {
        actual: err
      })
    } else {
      test.log(true, 'throws', msg)
    }
  }
}
