# tst

* tape-compatible
* async functions support
* `t.todo`, `t.fixme` for broken / unfinished tests
* `t.node`, `t.browser`, `t.require`, `t.import` - environment conditional tests
* `t.demo` - demo-run (can fail)
* `console.group` in browser
* inspectable errors
* correct stacktrace with sourcemaps
* `t.is` for generic comparison <!-- almost, same -->
* muted skipped
* better colors
* multiple `only` tests
* run by `idle`
* ES export

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

### Neighbor art

* [tape-modern](https://ghub.io/tape-modern)
* [@goto-bus-stop/tape-modern](https://github.com/goto-bus-stop/tape-modern#readme)

<p align="right">HK</p>
