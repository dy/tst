# tst

A function for running tests.

[![npm install tst](https://nodei.co/npm/tst.png?mini=true)](https://npmjs.org/package/tst/)

```js
// ./test/index.js
var tst = require('tst'),
    assert = require('assert');

tst('A very simple test', function() {
    var success = true;
    assert.ok(success);
});
```

```sh
$ node test.js
```

Or

```sh
$ beefy test.js
```
