A function for running tests.

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
// ./test.js

var test = require('tst');
var assert = require('assert');

//Uncomment this to run inclusive test mode
//test.only();

test('A very simple test', function() {
    var success = true;
    assert.ok(success);
});

//Exclusive test
test.skip('Skipped test', function () {

});

test(function () {
	test('Nested test', function () {

	});
});

//Inclusive test
test.only(function () {

});
```

Run in node: `$ node test.js` or in browser `$ beefy test.js`.


### Related

> [ava](https://npmjs.org/package/ava) — futuristic test runner by @sindresohrus.<br/>
> [mocha](https://npmjs.org/package/mocha) — vintage test runner by @tj.<br/>
> [tape](https://npmjs.org/package/tape) — Test Anything Protocol by @substack.<br/>
> [tap](https://npmjs.org/package/tap) — Test Anything Protocol by @isaacs<br/>
