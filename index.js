var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');

var INDENT = '  ';
var indentCount = 0;
var testCount = 0;


/**
 * Main test function
 */
function test (message, testFunction) {
    var resolve, reject;

    //init test object params
    var testObj = {
        indent: indentCount++,
        id: testCount++,
        title: message
    };

    if (!testFunction) {
        //if only message passed - do skip
        if (typeof message === 'string') {
            indentCount--;

            //return resolved promise
            var promise = Promise.resolve().then(function () {
                if (isBrowser) {
                    console.log('%c- ' + testObj.title, 'color: blue');
                }
                else {
                    console.log(chalk.cyan(indent(testObj.indent), '-', testObj.title));
                }
            });

            return promise;
        }

        //detect test name
        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testObj.id;

        //update test title
        testObj.title = message;
    }


    //exec promise
    var promise = new Promise(function (resolve, reject) {
        testObj.time = now();
        testFunction.call(testObj);
        testObj.time = now() - testObj.time;

        resolve();
    });

    //register formatters
    promise.then(
        function () {
            if (isBrowser) {
                console.log('%c√ ' + testObj.title + '%c' + indent(1) + testObj.time.toFixed(2) + 'ms', 'color: green', 'color:rgb(150,150,150); font-size:0.9em');
            }
            else {
                console.log(chalk.green(indent(testObj.indent), '√', testObj.title), chalk.gray(indent(1) + testObj.time.toFixed(2) + 'ms'));
            }
        },
        function (error) {
            //Leave formatting to browser, it shows errors better
            if (isBrowser) {
                console.group('%c× ' + testObj.title, 'color: red');
                console.error(error);
                console.groupEnd();
            }
            else {
                console.log(chalk.red(indent(testObj.indent), '×', testObj.title));

                //NOTE: node prints e.stack along with e.message
                console.error(chalk.gray(indent(testObj.indent + 1), error.stack));
            }
        }
    );

    indentCount--;

    return promise;
}

function skip (message) {
   return test(message);
}

//return indentation of a number
function indent (number) {
    var str = '';
    for (var i = 0; i < number; i++) {
        str += INDENT;
    }
    return str;
}


test.skip = skip;

module.exports = test;