import t from './index.js'
import * as assert from './assert.js'



t('assertions', (pass, fail) => {
  assert.ok(true)
  assert.is(1, 1)
  // assert.notEqual(1, 2)
  assert.is([1], [1])
  pass('passed')
})

t('passes', (pass) => {
  assert.ok(true);
  assert.ok(true, 'this time with an optional message');
  assert.ok('not true, but truthy enough');

  assert.is(1 + 1, 2);
  assert.is(Math.max(1, 2, 3), 3);
  assert.is([1, {x: 2, y: { z: 3 }}], [1, {y: { z: 3 }, x: 2}]);

  assert.throws(() => {
    throw new Error('oh no!');
  }, /oh no!/);

  assert.any(3, [1, 2, 3])
  assert.any(1, [1, 2, 3], 'equals any msg')
  assert.any(1, [1, 2, 3], 'one of')
  assert.any(['b'], [['a'], ['b']])

  assert.almost(0.1, new Float32Array([0.1])[0])
  assert.almost([0.1], new Float32Array([0.1]))

  assert.same([0, 1], [1, 0])

  assert.not([0, 1], [0, 2])
  assert.not(1,2)
  assert.not({x:1},{x:2})
  assert.not(document.createElement('a'),document.createElement('a'))
  assert.not(new Date,new Date(1))

  pass('ok')
})

t('fails', function (pass, fail) {
  assert.is(42, '42');
  assert.is({}, {x:1});
  assert.is([1,2,3], [4,5,6], 'arrs')

  assert.any(1, [2, 3])
  assert.any(['a'], [['b'], ['c']])

  assert.almost(0.11, new Float32Array([0.1])[0])
  assert.almost([0.11], new Float32Array([0.1]))

  assert.same([0, 1], [1, 0, 1])

  assert.not([0, 1], [0, 1])
  assert.not(1,1)
  assert.not({x:1},{x:1})

  fail('test failed')
})

t('async fail', async (pass, fail) => {
  await new Promise(ok => setTimeout(ok))
  // assert.fail('test failed')
  throw Error('xxx')
})


t.node('node-only', (pass, fail) => {
  assert.is(1, 1)
  assert.ok(true)
})

t.browser('browser-only', (pass, fail) => {
  assert.is(1, 1)
  assert.ok(true)
})

t('async ok', async (pass, fail) => {
  await new Promise(ok => setTimeout(ok, 500))
  pass('ok')
})

t.skip('demo-run', (pass, fail) => {
  assert.is(1, 1)
  assert.ok(false)
})

t.skip('this is skipped', (pass, fail) => {
  pass('ok')
})

t.todo('to be done', (pass, fail) => {
  assert.is(1, 1)
  assert.ok(true)
})

t.skip('to be fixed', (pass, fail) => {
  assert.is(1, 1)
  assert.ok(false)
})

t('async end', async (pass, fail) => {
  await new Promise(ok => setTimeout(ok, 500))
  pass('ok')
})
