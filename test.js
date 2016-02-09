var test = require('./');
var assert = require('assert');
// var test = it;

test('Successful test', function() {
    assert.ok(true);
});

test('Failed test', function () {
    assert.equal(1, 2);
});

test('Async test', function (done) {
	// console.log(1)
	setTimeout(function () {
		done();
		// console.log(2)
	}, 1000);

	test('Async nested', function (done) {
		this.timeout(false);
		setTimeout(done, 500);
		test('Async promise', new Promise (function (resolve) {
			setTimeout(function () {
				resolve();
			}, 1000);
			test('Async promise returned', function () {
				this.timeout(1000);
				return new Promise(function (done) {
					setTimeout(done, 1200);
				});
			});
		}));
	});
});

test.skip('Skipped test', function () {

});

test('Skipped test 2');

test(function () {

});

test(function NestedTestsContainer () {
	test('Nested test 1');

	test('Nested test 2', function (done) {
		setTimeout(function () {
			done();
		}, 500)
	});
	test('Nested test 3', function () {
		xxx;
	});
	test('Nested test 4', function () {
		test('Double nested test', function () {
			throw Error('xxx');
		});
	});
});

test.skip('Final', function () {

});

test.only('After-party', function () {

});