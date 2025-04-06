# tst

Test without <em>e</em>fforts.

* no tooling, vanilla ESM
* works both node/browser
* async functions support
* inspectable errors
* stacktrace with sourcemaps
* clean l&f in browser/node
* supports [assert](https://www.npmjs.com/package/assert), [chai](https://www.npmjs.com/package/chai) etc.
* minimal, 0dep
* tape API

## usage

```js
import test, { ok, is, not, throws } from 'tst.js'

test('tst demo test', () => {
	ok(true);
	ok(true, 'this time with an optional message');
	ok('not true, but truthy enough');

	is(1 + 1, 2);
	is(Math.max(1, 2, 3), 3);
	is({}, {})

	throws(() => {
		throw new Error('oh no!');
	}, /oh no!/);
})
```

## api

* `test.only` − run only selected test(s)
* `test.mute` − run test(s), mute assertions
* `test.skip` − bypass test(s)
* `test.todo` − bypass test(s), mark as WIP
* `test.demo` − demo run, skip failed assertions.

## assert

* `ok(a, msg?)` − generic truthfulness assert
* `is(a, b, msg?)` − assert with `Object.is` for primitives and `deepEqual` for objects
* `not(a, b, msg?)` - assert with `!Object.is` for primitives and `!deepEqual` for objects
* `any(a, [a, b, c], msg?)` − assert with optional results
* `same(listA, listB, msg?)` − assert same members of a list/set/map/object
* `throws(fn, msg?)` − fn must throw
* `pass(msg)`, `fail(msf)` − pass or fail the whole test.

## why?

Testing should not involve maintaining test runner.<br/>
It should be simple as [tap/tape](https://ghub.io/tape), working in browser/node, ESM, with nice l&f, done in a straightforward way.<br/>
I wasn't able to find such test runner that so I had to create one.

* [testra](https://github.com/eliot-akira/testra)
* [tape-modern](https://ghub.io/tape-modern)
* [@goto-bus-stop/tape-modern](https://github.com/goto-bus-stop/tape-modern#readme)
* [brittle](https://github.com/davidmarkclements/brittle)
* [tap](https://ghub.io/tap)
* [tape](https://github.com/tape-testing/tape)
* [zora](https://github.com/lorenzofox3/zora)
* [tapes](https://www.npmjs.com/package/tapes)
* [tape-es](https://github.com/vanillaes/tape-es)
* [uvu](https://github.com/lukeed/uvu)
* [pitesti](https://github.com/bengl/pitesti)

<p align="center"><a href="https://github.com/krishnized/license">🕉️</a></p>
