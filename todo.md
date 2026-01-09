* [x] importing a module like binaryen - that loads longer than 100ms causing tests to fail.
  - ✅ Fixed: auto-run now polls every 50ms until tests stabilize for 100ms (max 5s wait)

* [x] Make `run` a separate trigger
  - ✅ `run()` exported, can be called explicitly
  - Auto-run preserved for backward compat

* [x] Error inside the test (not failure) doesn't get red color in terminal
  - ✅ Fixed: errors now show in red with stack trace

* [x] Independent assert
  Now assert
  👎🏼 doesn't show passed test outside of test
  👎🏼 depends on tst.js

  I wonder how much sense it makes to follow uvu pattern in that regard, or maybe easier to just make it separate.
  Or use brittle pattern where assert is returned by test.

* [x] ~~assertions expect message arg, but it is almost never used, same time clutter args namespace making problematic props~~ -> we need message
  ? who needs message? Message is conveyed by test itself, isn't it? Or if test needs marking - it comes first, not last argument.

* [x] imbalanced pass/fail
  - If there's 1 fail, it blocks further N (maybe hundred) assertions, else if there's no fails, it counts hundreds of passes.
  - This way assertion numeration is screwed due to previous fails
  - ✅ Fixed: assertion numbers now reset per test (each test counts 1, 2, 3...)
  - Summary counts tests (pass/fail), not assertions

* ~~t.warn~~ - not planned (just use console.warn)

* [x] t.silent -> t.mute
  * show collapsed unless errors
  - ✅ Fixed: `test.mute('name', fn)` suppresses output unless test fails

* ~~t().times(5)~~ - not planned (use dedicated benchmark tools)

* ~~t.deprecate()~~ - not planned (use test.skip with comment)

* ~~t.fork()~~ - not planned (out of scope)

---

## Architecture Issues

* [x] Global mutable state prevents parallel execution
  - `assertc`, `index`, `passed`, `failed`, `skipped`, `only`, `current` are all module-level
  - Makes the module non-reentrant
  - ✅ Fixed: state encapsulated in closure, reset on each `run()`

* [x] Tight coupling: assert.js imports `current` from tst.js
  - Assertions can't be used standalone without test runner
  - ✅ Fixed: assertions standalone, use `setReporter()` hook for integration

* [x] No test isolation
  - Tests share same global environment
  - No beforeEach/afterEach hooks for setup/cleanup
  - ✅ Not needed: explicit `run()` allows `await setup(); await run(); await cleanup()`
  - `beforeEach` is just calling a function inside test body

* [x] Silent assertion failures outside tests
  - If `current` is `null`, `ok(true)` returns `undefined` - no feedback
  - ✅ Fixed: assertions return `true` on pass, throw on fail (work anywhere)

## Missing Features

* [x] Test timeout per test
  - ✅ Fixed: `test('name', { timeout: 1000 }, fn)` or `run({ timeout: 5000 })`
  - Default: 5000ms

* [x] Setup/teardown hooks
  - `test.before()`, `test.after()`, `test.beforeEach()`, `test.afterEach()`
  - ✅ Not needed: explicit `run()` makes this trivial: `setup(); await run(); cleanup()`

* [x] Test filtering via CLI
  - ✅ Already exists: `TST_GREP=pattern node test.js` or `?grep=pattern` in browser

* [x] Output format interface
  - ✅ Fixed: pluggable formats via `run({ format })` or `TST_FORMAT=tap`
  - `pretty` - colored output (default)
  - `tap` - TAP format for CI, pipeable to faucet/tap-spec
  - Custom: `formats.myFormat = { testStart, testSkip, assertion, testPass, testFail, summary }`

* ~~`t.plan(n)`~~ - not planned (async/await makes this less necessary)

* ~~Nested tests/subtests~~ - not planned (against minimal philosophy)

## Vision

1. **Decouple** assert ↔ runner ↔ format (orthogonal design) ✅
2. **Explicit** `run()` trigger instead of magic 100ms timeout ✅
3. **Stateless assertions** that work anywhere ✅
4. **Composable** hooks and plugins ✅

---

**Done.** Ship it. 🚀
