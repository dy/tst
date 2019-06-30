import t from '.'

t('x', t => {
  t.eq(1, 2)
  t.neq(1, 1)
  t.deq([1], [1,2])
  t.pass('passed')
})
