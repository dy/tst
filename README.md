# tst [![test](https://github.com/dy/tst/actions/workflows/test.yml/badge.svg)](https://github.com/dy/tst/actions/workflows/test.yml) [![npm](https://img.shields.io/npm/v/tst?color=red)](https://npmjs.org/package/tst) [![demo](https://img.shields.io/badge/demo-%F0%9F%9A%80-white)](https://dy.github.io/tst/) [![ॐ](https://img.shields.io/badge/MIT-%E0%A5%90-white)](https://krishnized.github.io/license)

Test without <em>e</em>fforts.

* vanilla ESM — no build, no tooling
* node + browser
* standalone assertions
* async, timeouts, TAP
* 0 deps, ~400 LOC

## usage

```js
import test from 'tst.js'

test('math', ({ ok, is }) => {
  ok(true)
  is(1 + 1, 2)
  is({a: 1}, {a: 1})  // deep equality
})

test('async', async ({ ok }) => {
  await fetch('/api')
  ok(true)
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
| `rejects(fn, match?, msg?)` | Assert async fn rejects (optionally matching regex/class) |
| `almost(a, b, eps?, msg?)` | Assert approximate equality |
| `pass(msg)` / `fail(msg)` | Explicit pass/fail |

> [!NOTE]
> Standalone use: `import { ok, is, not, any, same, throws, rejects, almost, pass, fail } from 'tst/assert.js'`


## modifiers

```js
test.skip('ignored', t => {})      // skip test
test.todo('future feature')        // mark as todo
test.only('focus', t => {})        // run only this
test.mute('quiet', t => {})        // hide assertions, show summary
test.demo('example', t => {})      // run but don't fail exit code
test.fork('isolate', t => {})      // run in worker thread (fresh V8 context)
```

> [!NOTE]
> Fork has no scope access — use `data` for values, `await import()` for modules.


## options

```js
test('name', {
  timeout: 3000,     // override default 5000ms
  data: { x: 1 },    // pass to callback as 2nd arg
  skip: isCI,        // conditionally skip
  retry: 3           // retry up to n times (flaky tests)
}, (t, data) => {})
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

> [!NOTE]
> Tests run sequentially. For parallelism, run separate test files.


## why?

You want to test `add(1, 2) === 3`.

Jest wants `jest.config.js`, `babel.config.js`, 200MB node_modules, transformation pipelines, mock systems.

Testing should be: write test, run file, see result. No ceremony. No maintenance. No build step.

Spiritual successor to [tape](https://ghub.io/tape) — browser + node, ESM-native, async-native.

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
