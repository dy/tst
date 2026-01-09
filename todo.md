* [x] importing a module like binaryen - that loads longer than 100ms causing tests to fail.
  - ✅ Fixed: auto-run now polls every 50ms until tests stabilize for 100ms (max 5s wait)

* [ ] Make `run` a separate trigger
  - `run()` is now exported, can be called explicitly
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

* [ ] t.warn
  ? what's use case?

* [x] t.silent -> t.mute
  * show collapsed unless errors
  - ✅ Fixed: `test.mute('name', fn)` suppresses output unless test fails

* [ ] t().times(5)
  * can be useful for benchmarks

* [ ] t.deprecate()
  Many tests are deprecated due to some reason. It's not always desirable to delete them, better have them around as evidence of wrong solutions. They're like, indicators of how API should not be organized, like, fail.

* [ ] t.fork()
  Some tests needs to be run independent of current deps stack - for eg. cross-tab testing

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

* [ ] Reporter interface
  - Currently locked into console output
  - TAP output for CI integration

* [ ] `t.plan(n)` - tape's assertion planning

* [ ] Nested tests/subtests hierarchy

## Vision

1. **Decouple** assert ↔ runner ↔ reporter (orthogonal design)
2. **Explicit** `run()` trigger instead of magic 100ms timeout
3. **Stateless assertions** that work anywhere
4. **Composable** hooks and plugins
