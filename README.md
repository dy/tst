# tst

Tests without <em>e</em>fforts.

## Gems

* works in browser without tooling steps
* works with any assert library: [assert](https://www.npmjs.com/package/assert), [chai](https://www.npmjs.com/package/chai) etc.
* async functions support
* inspectable errors
* correct stacktrace with sourcemaps
* better look & feel
* ESM

## Usage

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
import test from 'tst'
import { is, ok, throws, pass, fail } from 'tst/assert'

test('these tests will all pass', () => {
	ok(true);
	ok(true, 'this time with an optional message');
	ok('not true, but truthy enough');

	is(1 + 1, 2);
	is(Math.max(1, 2, 3), 3);
	is({}, {})

	throws(() => {
		throw new Error('oh no!');
	}, /oh no!/);

	pass('ok')
})

test('these tests will not pass', () => {
	is(42, '42');
	is({}, {x:1});

	fail('nok')
})

test.skip('this test will not run', () => {
	pass('ok')
})

test.browser('browser-only test', () => {

})
```

Creates output in console:

![preview](./preview.png)

## test types

* `test.skip` − bypass test, mutes output
* `test.only` − run only the indicated test, can be multiple
* `test.todo` − bypass test, indicate WIP sign
* `test.demo` − demo run, fail doesn't count.
* `test.node` − run test in node/deno only env.
* `test.browser` − run test in browser only test.

## `tst/assert.js`

* `ok(a, msg?)` − generic truthfulness assert
* `is(a, b, msg?)` − assert with `equal` for primitives and `deepEqual` for objects
* `not(a, b, msg?)` - assert with `equal` for primitives and `deepEqual` for objects
* `any(a, [a, b, c], msg?)` − assert with optional results
* `almost(a, b, eps, msg?)` − assert approximate value/array
* `same(listA, listB, msg?)` − assert same members of a list/set/map/object
* `throws(fn, msg?)` − fn must throw
* `pass(msg)`, `fail(msf)` − pass or fail the whole test.

### Neighbors

* [uvu](https://github.com/lukeed/uvu)
* [tape-modern](https://ghub.io/tape-modern)
* [@goto-bus-stop/tape-modern](https://github.com/goto-bus-stop/tape-modern#readme)

<p align="right">🕉️</p>
