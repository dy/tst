* async tests throw uncatchable errors in callbacks (in browser), in settimeouts
* assertion error in chrome looks unwieldy.
	* that is because of redefining this.stack in error.
	* maybe use [stack-utils](https://www.npmjs.com/package/stack-utils) or alike?
* async errors loose good stacktrace :(
* add href-grep for browser tests, like #5.
* `only` is painful with nested tests.
	* Propagate .only call up to parent, but keep siblings unaffected.