Minimalistic test runner.

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
// ./test.js

var test = require('tst')//.only();
var assert = require('assert');


test('Test trivial things', function() {
    var success = true;
    assert.equal(success, true);
});

test.skip('Do not test unwanted things', function () {
	var $ = require('jquery');
});

test('Group tests', function () {
	test('Nested', function () {

	});
	test('Nested', function () {

	});
});

test.only('Test of interest', function () {
	//To run exclusive test mode, add .only() in require
});
```

Run in node: `$ node ./test.js` or in browser `$ beefy ./test.js`.


### Related

> [ava](https://npmjs.org/package/ava) — futuristic test runner by @sindresohrus.<br/>
> [mocha](https://npmjs.org/package/mocha) — vintage test runner by @tj.<br/>
> [tape](https://npmjs.org/package/tape) — Test Anything Protocol by @substack.<br/>
> [tap](https://npmjs.org/package/tap) — Test Anything Protocol by @isaacs<br/>
