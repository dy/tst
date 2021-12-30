# Plan

* [ ] Make `run` a separate trigger

* [ ] Independent assert
  Now assert
  👎🏼 doesn't show passed test outside of test
  👎🏼 depends on tst.js

  I wonder how much sense it makes to follow uvu pattern in that regard, or maybe easier to just make it separate.
  Or use brittle pattern where assert is returned by test.

* [ ] assertions expect message arg, but it is almost never used, same time clutter args namespace making problematic props
  ? who needs message? Message is conveyed by test itself, isn't it? Or if test needs marking - it comes first, not last argument.

* [ ] imbalanced pass/fail
  . If we count assertions, we should not block on first fail.
  . If we count cases, we should ignore assertions.
  . Otherwise if there's 1 fail, it blocks further N (maybe hundred) assertions, else if there's no fails, it counts hundreds of passes.
  ? should we just count passed/failed tests, not assertions?
    + that solves independent assert issue (no need exporting current)
    + that reduces the number of expected

* [ ] t.warn
  ? what's use case?

* [ ] t.silent
  * show collapsed unless errors

* [ ] t().times(5)
  * can be useful for benchmarks

* [ ] t.deprecate()
  Many tests are deprecated due to some reason. It's not always desirable to delete them, better have them around as evidence of wrong solutions. They're like, indicators of how API should not be organized, like, fail.

* [ ] t.fork()
  Some tests needs to be run independent of current deps stack - for eg. cross-tab testing
