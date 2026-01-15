# tst

Test without <em>e</em>fforts.

* no tooling, vanilla ESM
* works both node/browser
* async functions support
* per-test timeout
* clean output in browser/node
* minimal, 0dep


[**Demo**](https://dy.github.io/tst/)

## usage

```js
import test from 'tst.js'

test('basic', ({ ok, is }) => {
  ok(true)
  is(1 + 1, 2)
  is({a: 1}, {a: 1})  // deep equality
})

test('async', async ({ ok }) => {
  await fetch('/api')
  ok(true)
})
```

> [!TIP]
> Assertions also exported as `{ ok, is, not, any, same, throws, rejects, almost, pass, fail }` for standalone use.

## assertions

| Function | Description |
|----------|-------------|
| `ok(a, msg?)` | Assert truthy |
| `is(a, b, msg?)` | Assert equal (`Object.is` for primitives, deep equal for objects) |
| `not(a, b, msg?)` | Assert not equal |
| `any(a, [x,y,z], msg?)` | Assert value is one of options |
| `same(a, b, msg?)` | Assert same members (order-independent) |
| `throws(fn, match?, msg?)` | Assert fn throws (optionally matching regex/class) |
| `rejects(fn, match?, msg?)` | Assert async fn rejects (optionally matching regex/class) |
| `almost(a, b, eps?, msg?)` | Assert approximate equality |
| `pass(msg)` / `fail(msg)` | Explicit pass/fail |

## modifiers

```js
test.skip('ignored', t => {})      // skip test
test.todo('future feature')        // mark as todo
test.only('focus', t => {})        // run only this
test.mute('quiet', t => {})        // hide assertions, show summary
test.demo('example', t => {})      // run but don't fail exit code
test.fork('isolate', t => {})      // run in worker thread
```


## config

Manual run (disables auto-run):

```js
import test from 'tst.js'
await test.run({
  grep: /api/,       // filter by name
  bail: true,        // stop on first failure
  mute: true,        // hide passing tests
  timeout: 10000,    // fail if takes >10s
  format: 'tap'      // pretty (default), tap or custom object
})
```

Or env vars:

```bash
TST_GREP=pattern node test.js  # filter by name
TST_BAIL=1 node test.js        # stop on first failure
TST_MUTE=1 node test.js        # hide passing tests
TST_FORMAT=tap node test.js    # TAP output (pipeable)
```

Or URL params (browser):
```
test.html?grep=pattern
test.html?bail
test.html?mute
test.html?format=tap
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
