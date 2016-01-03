var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');

var INDENT = '  ';
var indentCount = 0;

//list of current running tests
var currentTest;

//test ids
var testCount = 0;


function test (message, testFunction) {
    var resolve, reject;

    //init test object params
    var testObject = {
        parent: currentTest,
        indent: indentCount++,
        id: testCount++,
        title: message
    };


    if (!testFunction) {
        //if only message passed - do skip
        if (typeof message === 'string') {
            indentCount--;

            //return resolved promise
            return Promise.resolve(testObject).then(function (test) {
                if (isBrowser) {
                    console.log('%c- ' + test.title, 'color: blue');
                }
                else {
                    console.log(chalk.cyan(indent(test.indent), '-', test.title));
                }
            });
        }

        //detect test name
        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testObject.id;

        //update test title
        testObject.title = message;
    }


    //register formatters
    return (new Promise(function (resolve, reject) {
        try{
            testObject.time = now();
            testFunction.call(testObject);
            testObject.time = now() - testObject.time;
            resolve(testObject);
        } catch (e) {
            testObject.error = e;
            reject(testObject);
        }

        indentCount--;
    })).then(
        function (test) {
            if (isBrowser) {
                console.log('%c√ ' + test.title + '%c' + indent(1) + test.time.toFixed(2) + 'ms', 'color: green', 'color:rgb(150,150,150); font-size:0.9em');
            }
            else {
                console.log(chalk.green(indent(test.indent), '√', test.title), chalk.gray(indent(1) + test.time.toFixed(2) + 'ms'));
            }
        },
        function (test) {
            //Leave formatting to browser, it shows errors better
            if (isBrowser) {
                console.group('%c× ' + test.title, 'color: red');
                console.error(test.error);
                console.groupEnd();
            }
            else {
                console.log(chalk.red(indent(test.indent), '×', test.title));

                //NOTE: node prints e.stack along with e.message
                console.error(chalk.gray(indent(test.indent), test.error.stack));
            }
        }
    );
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