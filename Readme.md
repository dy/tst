TST

> Minimalistic test runner for browser and node with [mocha](http://npmjs.org/package/mocha)/[tap](http://npmjs.org/package/tap)-compatible API.

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
// ./test.js

var test = require('tst');
var assert = require('assert');


test('Test trivial things', function() {
    var success = true;
    assert.equal(success, true);
});

test.skip('Do not test unwanted things', function () {
	var $ = require('jquery');
});

test('Group tests', function () {
	test('A', function () {

	});
	test('B', function () {

	});
});

test.only('Test of interest', function () {
	//this test is run exclusively
});

test('Async stuff', function (done) {
	this.timeout(3000);
	setTimeout(done, 2100);
});
```

Run in node: `$ node ./test.js`

![Terminal](/terminal.png?raw=true "Terminal view")

or in browser: `$ beefy ./test.js`.

![Browser](/console.png?raw=true "Browser view")

If you’ve changed your mind, just return to mocha: `var test = it;`.


### Related

> [ava](https://npmjs.org/package/ava) — futuristic test runner by [@sindresorhus](https://github.com/sindresorhus).<br/>
> [mocha](https://npmjs.org/package/mocha) — vintage test runner by [@tj](https://github.com/tj).<br/>
> [tape](https://npmjs.org/package/tape) — Test Anything Protocol by [@substack](https://github.com/substack).<br/>
> [tap](https://npmjs.org/package/tap) — Test Anything Protocol by [@isaacs](https://github.com/isaacs)<br/>
> [tst](https://github.com/grahamlyons/tst) — initial version of tst by [@grahamlyons](https://github.com/grahamlyons)</br>