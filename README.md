# tst

* tape-compatible
* async
* interactive logs
* relevant stacktrace
* deepEqual <!-- almost, same -->
* no `t.end`, `t.plan`
* muted skipped

## Usage

```js
import t from 'https://unpkg.com/tst?module'

t('these tests will all pass', t => {
	t.ok(true);
	t.ok(true, 'this time with an optional message');
	t.ok('not true, but truthy enough');

	t.equal(1 + 1, 2);
	t.equal(Math.max(1, 2, 3), 3);
	t.deepEqual({}, {})

	t.throws(() => {
		throw new Error('oh no!');
	}, /oh no!/);

	t.pass('ok')
})

t('these tests will not pass', t => {
	t.equal(42, '42');
	t.equal({}, {});

	t.fail('nok')
})

t.skip('this test will not run', t => {
	t.pass('ok')
})
```

### Parallel art

* tape-modern
* @goto-bus-stop/tape-modern
