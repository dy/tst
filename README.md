# tst

Test without <em>e</em>fforts.

* no tooling, vanilla ESM
* works both node/browser
* async functions support
* per-test timeout
* clean output in browser/node
* minimal, 0dep


[**Demo**](https://dy.github.io/tst/demo.html)

## usage

```js
import test, { ok, is, not, throws, same, any } from 'tst.js'

test('basic', () => {
  ok(true)
  is(1 + 1, 2)
  is({a: 1}, {a: 1})  // deep equality
})

test('async', async () => {
  await fetch('/api')
  ok(true)
})

test('with timeout', { timeout: 1000 }, async () => {
  // fails if takes >1s
})
```

## assertions

| Function | Description |
|----------|-------------|
| `ok(a, msg?)` | Assert truthy |
| `is(a, b, msg?)` | Assert equal (`Object.is` for primitives, deep equal for objects) |
| `not(a, b, msg?)` | Assert not equal |
| `any(a, [x,y,z], msg?)` | Assert value is one of options |
| `same(a, b, msg?)` | Assert same members (order-independent) |
| `throws(fn, match?, msg?)` | Assert fn throws (optionally matching regex/class) |
| `almost(a, b, eps?, msg?)` | Assert approximate equality |
| `pass(msg)` / `fail(msg)` | Explicit pass/fail |

## test modifiers

```js
test.skip('ignored', () => {})     // skip test
test.todo('future feature')        // mark as todo
test.only('focus', () => {})       // run only this
test.mute('quiet', () => {})       // hide assertions, show summary
```

## config

```js
import test from 'tst.js'
await test.run({ grep: /api/, bail: true, mute: true, timeout: 10000 })
```

**Node.js** (env vars):
```bash
TST_GREP=pattern node test.js  # filter by name
TST_BAIL=1 node test.js        # stop on first failure
TST_MUTE=1 node test.js        # hide passing tests, show only failures
```

**Browser** (URL params):
```
test.html?grep=pattern
test.html?bail
test.html?mute
```

## auto-run vs manual

By default, tests **auto-run** after imports settle:

```js
import test, { ok } from 'tst.js'
test('auto', () => ok(true))  // runs automatically
```

For manual control, call `test.run()` explicitly:

```js
import test, { ok } from 'tst.js'
test('manual', () => ok(true))
await test.run({ bail: true })  // disables auto-run
```


## standalone assertions

Assertions work without the test runner:

```js
import { ok, is } from 'tst/assert.js'

ok(condition)  // returns true or throws Assertion error
is(a, b)       // returns true or throws
```

## why?

Testing should not involve maintaining test runner.<br/>
It should be simple as [tap/tape](https://ghub.io/tape), working in browser/node, ESM, with nice output, done straightforwardly.

<!--
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
-->

<p align="center"><a href="https://github.com/krishnized/license">ॐ</a></p>
