import deq from 'dequal'

export function fail(msg) {
  this.log(false, 'fail', msg)
}

export function pass(msg) {
  this.log(true, 'pass', msg)
}

export function ok(value, msg = 'should be truthy') {
  this.log(Boolean(value), 'ok', msg, {
    actual: value,
    expected: true
  })
}

export function notOk(value, msg = 'should be falsy') {
  this.log(!value, 'notOk', msg, {
    actual: value,
    expected: false
  })
}

export function equal(a, b, msg = 'should equal') {
  this.log(Object.is(a, b), 'equal', msg, {
    actual: a,
    expected: b
  })
}

export function notEqual(a, b, msg = 'should not equal') {
  this.log(!Object.is(a, b), 'notEqual', msg, {
    actual: a,
    expected: b
  })
}

export function equalAny(a, list, msg = 'should equal any') {
  this.log(list.some(b => Object.is(a, b)), 'equalAny', msg, {
    actual: a,
    expected: new (class Any extends Array {})(...list)
  })
}

export function deepEqual(a, b, msg = 'should deep equal') {
  this.log(deq(a, b), 'deepEqual', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
  })
}

export function notDeepEqual(a, b, msg = 'should deep equal') {
  this.log(!deq(a, b), 'notDeepEqual', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
  })
}

export function deepEqualAny(a, list, msg = 'should deep equal any') {
  this.log(list.some(b => deq(a, b)), 'deepEqualAny', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: new (class Any extends Array {})(...list.map(b =>
      isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
    ))
  })
}

export function is(a, b, msg = 'should be the same') {
  this.log(isPrimitive(a) || isPrimitive(b) ? Object.is(a, b) : deq(a, b), 'is', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
  })
}

export function same(a, b, msg = 'should have same members') {
  this.log(sameMembers(a, b), 'same', msg, {
    actual: a,
    expected: b
  })
}

export function oneOf(a, list, msg = 'should be one of') {
  this.log(list.some(b =>
    isPrimitive(a) || isPrimitive(b) ? Object.is(a, b) : deq(a, b)
  ), 'oneOf', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: new (class Any extends Array { })(...list.map(b =>
      isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
    ))
  })
}
export const any = oneOf

export function almost (a, b, eps, msg = 'should almost equal') {
  this.log(isPrimitive(a) || isPrimitive(b) ? almostEqual(a, b, eps) :
    Array.prototype.slice.call(a).every((a0, i) => a0 === b[i] || almostEqual(a0, b[i], eps)),
    'almost', msg, {
    actual: isPrimitive(a) ? a : a.slice ? a.slice() : Object.assign({}, a),
    expected: isPrimitive(b) ? b : b.slice ? b.slice() : Object.assign({}, b)
  })
}

export function throws(fn, expected, msg = 'should throw') {
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

function isPrimitive(val) {
  if (typeof val === 'object') {
    return val === null;
  }
  return typeof val !== 'function';
}

function almostEqual(a, b, eps) {
  if (eps === undefined) {
    eps = Math.min(
      Math.max(
        Math.abs(a - new Float32Array([a])[0]),
        Math.abs(b - new Float32Array([b])[0])
      ),
      1.19209290e-7
    )
  }

  var d = Math.abs(a - b)

  if (d <= eps) {
    return true
  }

  return a === b
}

function sameMembers(a, b) {
  a = Array.from(a), b = Array.from(b)

  if (a.length !== b.length) return false;

  if (!b.every(function (item) {
    var idx = a.indexOf(item);
    if (idx < 0) return false;
    a.splice(idx, 1);
    return true;
  })) return false;

  if (a.length) return false;

  return true;
}
