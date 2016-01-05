var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');
var elegantSpinner = require('elegant-spinner');
var logUpdate = require('log-update');
var ansi = require('ansi-escapes');


//default indentation
test.INDENT = '  ';

//whether we run the only test
test.ONLY = false;

//default timeout for async tests
test.TIMEOUT = 2000;

//chain of nested test calls
var tests = [];
var testCount = 0;

//planned tests to run
var testQueue = [];


/**
 * Test enqueuer
 */
function test (message, fn) {
    //if run in exclusive mode - allow only `test.only` calls
    if (test.ONLY) return test;

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = {
        id: testCount++,
        title: message,
        status: null,
        fn: fn
    };

    //handle args
    if (!fn) {
        //if only message passed - do skip
        if (!fn && typeof message === 'string') {
            testObj.status = 'skip';
        }
        else {
            //detect test name
            testObj.fn = message;
            message = message.name;
            if (!message) message = 'Test #' + testObj.id;

            //update test title
            testObj.title = message;
        }
    }

    //plan running new test
    testQueue.push(testObj);

    //run tests queue
    run();

    return test;
}

/**
 * Tests queue runner
 */
var currentTest;
function run () {
    //ignore active run
    if (currentTest) return;

    //get the planned test
    currentTest = testQueue.shift();

    //if the queue is empty - return
    if (!currentTest) return;

    //exec it, the promise will be formed
    exec(currentTest);

    //plan running next test after the promise
    currentTest.promise.then(function () {
        currentTest = null;
        run();
    }, function () {
        currentTest = null;
        run();
    });
}


/**
 * Test executor
 */
function exec (test) {
    //detect indent based on running nested tests
    test.indent = tests.length;
    test.parent = tests[tests.length - 1];

    //create nesting references
    if (test.parent) {
        if (!test.parent.children) test.parent.children = [];
        test.parent.children.push(test);
    }


    //ignore skipping test
    if (test.status === 'skip') {
        test.promise = Promise.resolve();
        printResult(test);
        return test;
    }

    //save test to the chain
    tests.push(test);

    var isAsync = test.fn.length;

    //exec sync test
    if (!isAsync) {
        try {
            test.time = now();
            test.fn.call(test);
            test.time = now() - test.time;

            if (!test.status) test.status = 'success';
        } catch (e) {
            //set parents status to error happened in nested test
            var parent = test.parent;
            while (parent) {
                parent.status = 'warning';
                parent = parent.parent;
            }

            //update test status
            test.status = 'error';
            test.error = e;
        }

        printResult(test);

        test.promise = Promise.resolve();

        //remove test from the chain
        tests.pop();
    }
    //exec async test - it should be run in promise
    //sorry about the stacktrace, nothing I can do...
    else {
        if (!test.timeout) test.timeout = test.TIMEOUT;
        test.promise = Promise.race([
            new Promise(function (resolve, reject) {
                printTitle(test);
                test.time = now();
                test.fn.call(test, resolve);
            }),
            new Promise(function (resolve, reject) {
                // setTimeout()
            })
        ]).then(function () {
            test.time = now() - test.time;
            if (!test.status) test.status = 'success';
            printResult(test);

            tests.pop();
        }, function (e) {
            var parent = test.parent;
            while (parent) {
                parent.status = 'warning';
                parent = parent.parent;
            }

            //update test status
            test.status = 'error';
            test.error = e;
            printResult(test);

            tests.pop();
        });
    }


    return test;
}


//print title (indicator of started test)
var titleInterval;
function printTitle (test) {
    if (!isBrowser) {
        var frame = elegantSpinner();

        updateTitle();
        titleInterval = setInterval(updateTitle, 50);

        //update title frame
        function updateTitle () {
            //FIXME: this is the most undestructive for logs way of rendering, but crappy
            process.stdout.write(ansi.cursorLeft);
            process.stdout.write(ansi.eraseEndLine);
            process.stdout.write(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title) + indent(1));
            // logUpdate(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title));
        }
    }
}
//clear printed title (mostly node)
function clearTitle () {
    if (!isBrowser && titleInterval) {
        clearInterval(titleInterval);
        process.stdout.write(ansi.cursorLeft);
        process.stdout.write(ansi.eraseEndLine);
    }
}


//print only 1st level guys
//because the result of the children is not the result of parent :)
function printResult (test) {
    if (!test.parent) print(test);
}


//universal printer dependent on resolved test
function print (test) {
    clearTitle();

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


//return indentation of a number
function indent (number) {
    var str = '';
    for (var i = 0; i < number; i++) {
        str += test.INDENT;
    }
    return str;
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