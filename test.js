import t from './index.js'

t('assertions', t => {
  t.equal(1, 1)
  t.notEqual(1, 2)
  t.deepEqual([1], [1])
  t.pass('passed')
})

t('passes', t => {
  t.ok(true);
  t.ok(true, 'this time with an optional message');
  t.ok('not true, but truthy enough');

  t.equal(1 + 1, 2);
  t.equal(Math.max(1, 2, 3), 3);

  t.throws(() => {
    throw new Error('oh no!');
  }, /oh no!/);

  t.pass('ok')
})

t('fails', t => {
  t.equal(42, '42');
  t.equal({}, {});
  t.deepEqual([1,2,3], [4,5,6]);

  t.fail('nok')
})

t.node('node-only', t => {
  t.is(1, 1)
  t.ok(true)
})

t.browser('browser-only', t => {
  t.is(1, 1)
  t.ok(true)
})

t.demo('demo-run', t => {
  t.is(1, 1)
  t.notOk(true)
})

t.skip('this is skipped', t => {
  t.pass('ok')
})

t.todo('to be done', t => {
  t.is(1, 1)
  t.notOk(true)
})

t.fixme('to be fixed', t => {
  t.is(1, 1)
  t.notOk(true)
})

t('async', async t => {
  await new Promise(ok => setTimeout(ok, 500))
  t.pass('ok')
})
