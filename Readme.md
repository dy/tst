# tst

A CommonJS module exporting a function for running tests.

e.g.

    // ./test/index.js
    var tst = require('tst'),
        assert = require('assert');

    tst('A very simple test', function() {
        var success = true;
        assert.ok(success);
    });

Run with:

    node test
