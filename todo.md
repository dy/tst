* test CI systems: throwing exit status correctly or something
* async tests throw uncatchable errors in callbacks (in browser), in settimeouts
* assertion error in chrome looks unwieldy.
	* that is because of redefining this.stack in error.
	* maybe use [stack-utils](https://www.npmjs.com/package/stack-utils) or alike?
	* an idea - to capture stack on test start, to see at least the entry point. And then parse with stacktrace-parser or alike.
* async errors loose good stacktrace :(
* add href-grep for browser tests, like #5.
* add links in browser console to trigger hash-href