* show status of grouped parent tests as the summary status of the children
* think of impementing sync strategy - just form a test source code based on collected grouped tests.
	* Or fix up errors - now they are awful. throwing string, throwing error etc.
		* though it may depend on server runner, not the tst itself
* measure time for the parent test as a sum of inner times (if contain kids - do not end timer).
* add tap-spec etc output, to show test summary
* show diff nicely, at least line numbers with diff, or objects
* force done if test error happened, do not wait for it to be called
* make stack trace not worse than mocha
* async tests throw uncatchable errors in callbacks (in browser), in settimeouts
* assertion error in chrome looks unwieldy.
	* that is because of redefining this.stack in error.
	* maybe use [stack-utils](https://www.npmjs.com/package/stack-utils) or alike?
	* an idea - to capture stack on test start, to see at least the entry point. And then parse with stacktrace-parser or alike.
* async errors loose good stacktrace :(
* add href-grep for browser tests, like #5.
* add links in browser console to trigger hash-href