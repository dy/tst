# tst

* tape-compatible
* async
* `t.todo`, `t.fixme` - broken/unfinished
* `t.node`, `t.browser` - target env tests
* `t.demo` - demo-run (can fail)
* `t.silent` - no
* inspectable logs
* correct stacktrace with sourcemaps
* `is` assert <!-- almost, same -->
* muted skipped
* colors

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
	t.is({}, {});

	t.fail('nok')
})

t.skip('this test will not run', t => {
	t.pass('ok')
})
```

### Neighbor art

* tape-modern
* @goto-bus-stop/tape-modern

<p align="right">HK</p>
