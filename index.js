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
    //if run in exclusive mode - allow only `test.only` calls
    if (test.ONLY) return test;

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = {
        id: testCount++,
        title: message,
        indent: tests.length,
        parent: tests[tests.length - 1],
        status: null
    };

    //create nesting references
    if (testObj.parent) {
        if (!testObj.parent.children) testObj.parent.children = [];
        testObj.parent.children.push(testObj);
    }

    //handle args
    if (!testFunction) {
        //if only message passed - do skip
        if (typeof message === 'string') {
            testObj.status = 'skip';
            testObj.promise = Promise.resolve();
            printFirstLevel(testObj);
            return test;
        }

        //detect test name
        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testObj.id;

        //update test title
        testObj.title = message;
    }

    //save test to the chain
    tests.push(testObj);

    var isAsync = testFunction.length;

    //exec sync test
    if (!isAsync) {
        try {
            testObj.time = now();
            testFunction.call(testObj);
            testObj.time = now() - testObj.time;

            if (!testObj.status) testObj.status = 'success';
        } catch (e) {
            //set parents status to error happened in nested test
            var parent = testObj.parent;
            while (parent) {
                parent.status = 'warning';
                parent = parent.parent;
            }

            //update test status
            testObj.status = 'error';
            testObj.error = e;
        }

        printFirstLevel(testObj);

        testObj.promise = Promise.resolve();
    }

    //remove test from the chain
    tests.pop();


    return test;
}


//return indentation of a number
function indent (number) {
    var str = '';
    for (var i = 0; i < number; i++) {
        str += test.INDENT;
    }
    return str;
}

//print only 1st level guys
function printFirstLevel (test) {
    if (!test.parent) print(test);
}


//universal printer dependent on resolved test
function print (test) {
    var single = test.children && test.children.length ? false : true;

    if (test.status === 'error') {
        printError(test);
    }
    else if (test.status === 'warning') {
        printWarn(test, single);
    }
    else if (test.status === 'success') {
        printSuccess(test, single);
    }
    else if (test.status === 'skip') {
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
        if (test.error) {
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

//more obvious chain
test.test = test;


module.exports = test;