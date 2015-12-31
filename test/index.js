var test = require('../index'),
    assert = require('assert');

test('Successful test', function() {
    assert.ok(true);
});

test('Failed test', function () {
    xxx;
});

test('Async test', function () {

});

test.skip('Skipped test', function () {

});

test('Skipped test 2');


test('Nested test', function () {
	test('Nestee', function () {

	});
});