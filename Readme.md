# tst

A function for running tests, forward-compatible with [tap]().

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
// ./test/index.js
var test = require('tst'),
    assert = require('assert');

test('A very simple test', function() {
    var success = true;
    assert.ok(success);
});

test.skip('Another test', function () {

});
```

Run in node: `$ node test.js` or in browser `beefy test.js`.
