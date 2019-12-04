let t = require('./index.js')

t('x', t => {
  t.equal(1, 1)
  t.notEqual(1, 2)
  t.deepEqual([1], [1])
  t.pass('passed')
})

t('these tests will all pass', t => {
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

t.skip('these tests will not pass', t => {
  t.equal(42, '42');
  t.equal({}, {});

  t.fail('nok')
})

t.skip('this test will not run', t => {
  t.pass('ok')
})
