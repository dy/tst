var test = require('../index'),
    assert = require('assert');

test('Successful test', function() {
    assert.ok(true);
});

test('Failed test', function () {
    xxx;
});

test.skip('Async test', function (done) {
	setTimeout(function () {
		done();
	});
});

test.skip('Skipped test', function () {

});

test('Skipped test 2');

test(function testAsFunctionName () {

});