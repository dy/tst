import t from '.'

t('x', t => {
  t.eq(1, 2)
  t.neq(1, 1)
  t.deq([1], [1,2])
  t.pass('passed')
})

t('these tests will all pass', t => {
  t.ok(true);
  t.ok(true, 'this time with an optional message');
  t.ok('not true, but truthy enough');

  t.eq(1 + 1, 2);
  t.eq(Math.max(1, 2, 3), 3);

  t.err(() => {
    throw new Error('oh no!');
  }, /oh no!/);

  t.pass('ok')
})

t('these tests will not pass', t => {
  t.eq(42, '42');
  t.eq({}, {});

  t.fail('nok')
})

t.skip('this test will not run', t => {
  t.pass('ok')
})
