* [ ] Make `run` a separate trigger

* [x] Independent assert
  Now assert
  👎🏼 doesn't show passed test outside of test
  👎🏼 depends on tst.js

  I wonder how much sense it makes to follow uvu pattern in that regard, or maybe easier to just make it separate.
  Or use brittle pattern where assert is returned by test.

* [x] ~~assertions expect message arg, but it is almost never used, same time clutter args namespace making problematic props~~ -> we need message
  ? who needs message? Message is conveyed by test itself, isn't it? Or if test needs marking - it comes first, not last argument.

* [ ] imbalanced pass/fail
  - If there's 1 fail, it blocks further N (maybe hundred) assertions, else if there's no fails, it counts hundreds of passes.
  - This way assertion numeration is screwed due to previous fails
  . If we count assertions, we should not block on first fail.
  . If we count cases, we should ignore assertions.
  ? should we just count passed/failed tests, not assertions?
    + that solves independent assert issue (no need exporting current)
    + that reduces the number of expected
    - very dull output, no much point in having grouping

* [ ] t.warn
  ? what's use case?

* [x] t.silent -> t.mute
  * show collapsed unless errors

* [ ] t().times(5)
  * can be useful for benchmarks

* [ ] t.deprecate()
  Many tests are deprecated due to some reason. It's not always desirable to delete them, better have them around as evidence of wrong solutions. They're like, indicators of how API should not be organized, like, fail.

* [ ] t.fork()
  Some tests needs to be run independent of current deps stack - for eg. cross-tab testing
