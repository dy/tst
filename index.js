var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');

var INDENT = '  ';
var testCount = 0;
var tests = [];

/**
 * Main test function
 */
function test (message, testFunction) {
    var resolve, reject;

    //init test object params
    var testObj = {
        id: testCount++,
        title: message,
        indent: tests.length,
        parent: tests[tests.length - 1]
    };

    if (testObj.parent) {
        if (!testObj.parent.children) testObj.parent.children = [];
        testObj.parent.children.push(testObj);
    }

    tests.push(testObj);

    if (!testFunction) {
        //if only message passed - do skip
        if (typeof message === 'string') {
            return end(testObj);
        }

        //detect test name
        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testObj.id;

        //update test title
        testObj.title = message;
    }


    //exec
    try {
        testObj.time = now();
        testFunction.call(testObj);
        testObj.time = now() - testObj.time;

        testObj.success = true;
    } catch (e) {
        //notify parents that error happened
        if (tests.length) {
            for (var i = tests.length; i--;) {
                tests[i].error = true;
            }
        }

        testObj.error = e;
    }

    return end(testObj);
}


//skipper
test.skip = function skip (message) {
   return test(message);
};


//test ender - prints logs, if needed
function end (testObj) {
    tests.pop();

    //if first level finished - log resolved tests
    if (!tests.length) {
        print(testObj);
    }
}

//return indentation of a number
function indent (number) {
    var str = '';
    for (var i = 0; i < number; i++) {
        str += INDENT;
    }
    return str;
}


//universal printer dependent on resolved test
function print (test) {
    if (test.error instanceof Error) {
        printError(test);
    }
    else if (test.error) {
        printWarn(test);
    }
    else if (test.success) {
        printSuccess(test);
    }
    else {
        printSkip(test);
    }

    if (test.children) {
        for (var i = 0, l = test.children.length; i < l; i++) {
            print(test.children[i]);
        }
    }
}

//print pure red error
function printError (test) {
    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + test.title, 'color: red');
        if (test.error && test.error !== true) {
            console.error(test.error);
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(test.indent), '×', test.title));

        //NOTE: node prints e.stack along with e.message
        if (test.error.stack) {
            var stack = test.error.stack.replace(/^\s*/gm, indent(test.indent + 1) + ' ');
            console.error(chalk.gray(stack));
        }
    }
}

//print green success
function printSuccess (test) {
    if (isBrowser) {
        console.log('%c√ ' + test.title + '%c' + indent(1) + test.time.toFixed(2) + 'ms', 'color: green', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log(chalk.green(indent(test.indent), '√', test.title), chalk.gray(indent(1) + test.time.toFixed(2) + 'ms'));
    }
}

//print yellow warning (not all tests passed)
function printWarn (test) {
    if (isBrowser) {
        console.log('%c~ ' + test.title + '%c' + indent(1) + test.time.toFixed(2) + 'ms', 'color: yellow', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log(chalk.yellow(indent(test.indent), '~', test.title), chalk.gray(indent(1) + test.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
function printSkip (test) {
    if (isBrowser) {
        console.log('%c- ' + test.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(test.indent), '-', test.title));
    }
}


module.exports = test;