# tst

Tests without <em>e</em>fforts.

## Gems

* tape-like
* async functions support
* inspectable errors
* correct stacktrace with sourcemaps
* muted skipped
* better colors
* multiple `only` tests
* start by `idle` event
* ES export
* `test.todo`, `test.fixme` for broken / unfinished tests
* `test.node`, `test.browser` - environment conditional tests
* `test.demo` - demo-run (can fail)
* `console.group` in browser

## Install

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

or

```js
import t from 'https://unpkg.com/tst?module'
```

## Use

```js
t('these tests will all pass', t => {
	t.ok(true);
	t.ok(true, 'this time with an optional message');
	t.ok('not true, but truthy enough');

	t.is(1 + 1, 2);
	t.is(Math.max(1, 2, 3), 3);
	t.is({}, {})

	t.throws(() => {
		throw new Error('oh no!');
	}, /oh no!/);

	t.pass('ok')
})

t('these tests will not pass', t => {
	t.is(42, '42');
	t.is({}, {x:1});

	t.fail('nok')
})

t.skip('this test will not run', t => {
	t.pass('ok')
})
```

Creates output in console:

![preview](./preview.png)


## Assertions

* `t.ok(a, b, msg?)` − generic truthfulness assert
* `t.is(a, b, msg?)` − assert with `equal` for primitives and `deepEqual` for other
* `t.any(a, [a, b, c], msg?)` − assert with optional results
* `t.almost(a, b, eps, msg?)` − assert approximate value/array
* `t.same(listA, listB, msg?)` − assert same members
* `t.throws(fn, msg?)` − fn must throw
* `t.pass(msg)`, `t.fail(msf)` − pass or fail the whole test.

### Neighbors

* [tape-modern](https://ghub.io/tape-modern)
* [@goto-bus-stop/tape-modern](https://github.com/goto-bus-stop/tape-modern#readme)

<p align="right">🕉️</p>
