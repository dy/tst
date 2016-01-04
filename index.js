var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');

//default indentation
test.INDENT = '  ';

//whether we run the only test
test.ONLY = false;

//chain of nested test calls
var tests = [];
var testCount = 0;

/**
 * Main test function
 */
function test (message, testFunction) {
    if (test.ONLY) return test;

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = {
        id: testCount++,
        title: message,
        indent: tests.length,
        parent: tests[tests.length - 1]
    };

    //create nesting references
    if (testObj.parent) {
        if (!testObj.parent.children) testObj.parent.children = [];
        testObj.parent.children.push(testObj);
    }

    //append current test to the chain
    tests.push(testObj);


    //handle args
    if (!testFunction) {
        //if only message passed - do skip
        if (typeof message === 'string') {
            end(testObj);
            return test;
        }

        //detect test name
        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testObj.id;

        //update test title
        testObj.title = message;
    }


    //exec test
    try {
        testObj.time = now();
        testFunction.call(testObj);
        testObj.time = now() - testObj.time;

        //update status
        testObj.success = true;
    } catch (e) {
        //set parents status to error happened in nested test
        if (tests.length) {
            for (var i = tests.length; i--;) {
                tests[i].error = true;
            }
        }

        //update test status
        testObj.error = e;
    }

    end(testObj);

    return test;
}


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
        str += test.INDENT;
    }
    return str;
}


//universal printer dependent on resolved test
function print (test) {
    var single = test.children && test.children.length ? false : true;

    if (test.error instanceof Error) {
        printError(test);
    }
    else if (test.error) {
        printWarn(test, single);
    }
    else if (test.success) {
        printSuccess(test, single);
    }
    else {
        printSkip(test, single);
    }

    if (test.children) {
        for (var i = 0, l = test.children.length; i < l; i++) {
            print(test.children[i]);
        }
    }

    if (!single && isBrowser) console.groupEnd();
}

//print pure red error
function printError (test) {
    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + test.title, 'color: red; font-weight: normal');
        if (test.error && test.error !== true) {
            console.error(test.error);
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(test.indent) + ' × ' + test.title));

        //NOTE: node prints e.stack along with e.message
        if (test.error.stack) {
            var stack = test.error.stack.replace(/^\s*/gm, indent(test.indent) + '   ');
            console.error(chalk.gray(stack));
        }
    }
}

//print green success
function printSuccess (test, single) {
    if (isBrowser) {
        console[single ? 'log' : 'group']('%c√ ' + test.title + '%c  ' + test.time.toFixed(2) + 'ms', 'color: green; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log(chalk.green(indent(test.indent) + ' √ ' + test.title) + chalk.gray(' ' + test.time.toFixed(2) + 'ms'));
    }
}

//print yellow warning (not all tests passed)
function printWarn (test, single) {
    if (isBrowser) {
        console[single ? 'log' : 'group']('%c~ ' + test.title + '%c  ' + test.time.toFixed(2) + 'ms', 'color: orange; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log(chalk.yellow(indent(test.indent) + ' ~ ' + test.title) + chalk.gray('  ' + test.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
function printSkip (test, single) {
    if (isBrowser) {
        console[single ? 'log' : 'group']('%c- ' + test.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(test.indent) + ' - ' + test.title));
    }
}


//skip alias
test.skip = function skip (message) {
   return test(message);
};

//half-working only alias
test.only = function only (message, fn) {
    test.ONLY = false;
    test(message, fn);
    test.ONLY = true;
    return test;
}


module.exports = test;