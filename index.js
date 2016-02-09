/**
 * Simple node/browser test runner
 *
 * @module tst
 */

var chalk = require('chalk');
var isBrowser = require('is-browser');
var now = require('performance-now');
var elegantSpinner = require('elegant-spinner');
var logUpdate = require('log-update');
var ansi = require('ansi-escapes');


// Error.stackTraceLimit = 10;


//default indentation
test.INDENT = '  ';

//whether we run the only test, forcefully
test.ONLY_MODE = false;

//default timeout for async tests
test.TIMEOUT = 2000;

//max timeout
test.MAX_TIMEOUT = 10e5;

//chain of nested test calls
var tests = [];
var testCount = 0;

//planned tests to run
var testQueue = [];

//flag indicating that since some time tests are run in deferred fashion
//i.e. lost their stack in browser :(
var DEFERRED = false;

//indicate whether we are in only-detection mode (tests are just planned, not run)
//or we are in a forced full-bundle run. Unlikely user will ever touch this flag.
test.DETECT_ONLY = true;

//detect whether at least one test failed
test.ERROR = false;


//end with error, if any
process.on('exit', function () {
    if (test.ERROR) process.exit(1);
});


//run execution after all sync tests are registered
if (test.DETECT_ONLY) {
    setTimeout(function () {
        //if only detection mode wasn’t changed by user
        //which means sync tests are run already - run the thing
        if (test.DETECT_ONLY) {
            run();
        }
    });
}


/**
 * Test enqueuer
 */
function test (message, fn, only) {
    //if run in exclusive mode - allow only `test.only` calls
    if (test.ONLY_MODE && !only) {
        //but if test is run within the parent - allow it
        if (!tests.length) return test;
    }

    //ignore bad args
    if (!message) return test;

    //init test object params
    var testObj = {
        id: testCount++,
        title: message,

        //pending, success, error, group
        status: null,

        //test function
        fn: fn,

        //nested tests
        children: [],

        //whether test should be resolved
        async: undefined,

        //whether the test is last child within the group
        last: false,

        //timeout for the async
        _timeout: test.TIMEOUT,

        //whether the test is the only to run (launched via .only method)
        only: !!only,

        //whether the test was started in deferred fashion
        //it can be sync, but launched after async
        deferred: DEFERRED
    };

    //mocha-compat only
    testObj.timeout = (function (value) {
        if (value == null) return this._timeout;
        if (value === false) this._timeout = test.MAX_TIMEOUT;
        else if (value === Infinity) this._timeout = test.MAX_TIMEOUT;
        else this._timeout = value;
        return this;
    }).bind(testObj);

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

    //detect async as at least one function argument
    //NOTE: tests returning promise will set async flag here
    if (testObj.async == null) {
        testObj.async = !!(testObj.fn && testObj.fn.length);
    }

    //also detect promise, if passed one
    if (testObj.fn && testObj.fn.then) {
        //also that means that the test is run already
        //and tests within the promise executor are already detected it’s parent wrongly
        //nothing we can do. Redefining parent is not an option -
        //we don’t know which tests were of this parent, which were not.
        testObj.promise = testObj.fn;
        testObj.async = true;
        testObj.time = now();
    }

    //nested tests are detected here
    //because calls to `.test` from children happen only when some test is active
    testObj.parent = tests[tests.length - 1];

    //register children
    if (testObj.parent) {
        testObj.parent.children.push(testObj);
    }
    //if test has no parent - plan it's separate run
    else {
        testQueue.push(testObj);
    }

    //if detecion only mode - ignore execution
    //if ONLY_MODE - execute it at instant
    if (!test.DETECT_ONLY || test.ONLY_MODE) {
        run();
    }

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

    //ignore test if it is not the only run
    if (test.ONLY_MODE && !currentTest.only) {
        return planRun();
    }

    //exec it, the promise will be formed
    exec(currentTest);

    //at the moment test is run, we know all it’s children
    //push all the children to the queue, after the current test
    //FIXME: this guy erases good stacktrace :< Maybe call asyncs last?
    var children = currentTest.children;

    for (var i = children.length; i--;){
        testQueue.unshift(children[i]);
    }

    //mark last kid
    if (children.length) {
        children[children.length - 1].last = true;
    }

    //if test is not async - run results at instant to avoid losing stacktrace
    if (!currentTest.async) {
        currentTest = null;
        run();
    }
    //plan running next test after the promise
    else {
        DEFERRED = true;
        currentTest.promise.then(planRun, planRun);
    }

    function planRun () {
        currentTest = null;
        run();
    }
}


/**
 * Test executor
 */
function exec (testObj) {
    //ignore skipping test
    if (testObj.status === 'skip') {
        testObj.promise = Promise.resolve();
        print(testObj);
        return testObj;
    }

    //save test to the chain
    tests.push(testObj);

    //display title of the test
    printTitle(testObj);

    //timeout promise timeout id
    var toId;

    //exec sync test
    if (!testObj.async) {
        testObj.promise = Promise.resolve();

        var time;
        try {
            testObj.time = now();
            var result = testObj.fn.call(testObj);
            time = now() - testObj.time;
        } catch (e) {
            error(e);
        }

        //if the result is promise - whoops, we need to run async
        if (result && result.then) {
            testObj.async = true;
            testObj.promise = result;
            //FIXME: this guy violates the order of nesting
            //because as far it was thought as sync
            execAsync(testObj);
        }

        //if result is not error - do finish
        else if (!testObj.error) {
            testObj.time = time;
            if (!testObj.status !== 'group') testObj.status = 'success';
            print(testObj);
        }
    }
    else {
        execAsync(testObj);
    }

    //after promise’s executor, but before promise then’s
    //so user can’t create tests asynchronously, they should be created at once
    tests.pop();

    //exec async test - it should be run in promise
    //sorry about the stacktrace, nothing I can do...
    function execAsync (testObj) {
        //if promise is already created (by user) - race with timeout
        //FIXME: add time measure
        if (testObj.promise) {
            testObj.promise = Promise.race([
                testObj.promise,
                new Promise(execTimeout)
            ]);
        }
        //else - invoke function
        else {
            testObj.promise = Promise.race([
                new Promise(function (resolve, reject) {
                    testObj.status = 'pending';
                    testObj.time = now();
                    return testObj.fn.call(testObj, resolve);
                }),
                new Promise(execTimeout)
            ])
        }

        testObj.promise.then(function () {
            clearTimeout(toId);
            testObj.time = now() - testObj.time;
            if (testObj.status !== 'group') testObj.status = 'success';

            print(testObj);
        }, error);

        function execTimeout (resolve, reject) {
            toId = setTimeout(function () {
                reject(new Error('Timeout ' + testObj._timeout + 'ms reached. Please fix the test or set `this.timeout(' + (testObj._timeout + 1000) + ');`.'));
            }, testObj._timeout);
        }
    }

    //error handler
    function error (e) {
        //grab stack (the most actual is here, further is mystically lost)
        testObj.stack = e.stack;

        //set flag that bundle is failed
        test.ERROR = true;

        var parent = testObj.parent;
        while (parent) {
            parent.status = 'group';
            parent = parent.parent;
        }

        //update test status
        testObj.status = 'error';
        testObj.error = e;

        print(testObj);
    }

    return testObj;
}


//print title (indicator of started, now current test)
var titleInterval;
function printTitle (testObj) {
    if (!isBrowser) {
        var frame = elegantSpinner();

        updateTitle();
        titleInterval = setInterval(updateTitle, 50);

        //update title frame
        function updateTitle () {
            //FIXME: this is the most undestructive for logs way of rendering, but crappy
            process.stdout.write(ansi.cursorLeft);
            process.stdout.write(ansi.eraseEndLine);
            process.stdout.write(chalk.white(indent(testObj) + ' ' + frame() + ' ' + testObj.title) + test.INDENT);
            // logUpdate(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title));
        }
    }
}
//clear printed title (node)
function clearTitle () {
    if (!isBrowser && titleInterval) {
        clearInterval(titleInterval);
        process.stdout.write(ansi.cursorLeft);
        process.stdout.write(ansi.eraseEndLine);
    }
}


//universal printer dependent on resolved test
function print (testObj) {
    clearTitle();

    var single = testObj.children && testObj.children.length ? false : true;

    if (testObj.status === 'error') {
        printError(testObj);
    }
    else if (testObj.status === 'group') {
        printGroup(testObj, single);
    }
    else if (testObj.status === 'success') {
        printSuccess(testObj, single);
    }
    else if (testObj.status === 'skip') {
        printSkip(testObj, single);
    }

    //last child should close parent’s group in browser
    if (testObj.last) {
        if (isBrowser) {
            //if truly last - create as many groups as many last parents
            if (!testObj.children.length) {
                console.groupEnd();
                var parent = testObj.parent;
                while (parent && parent.last) {
                    console.groupEnd();
                    parent = parent.parent;
                }
            }
        } else {
            //create padding
            if (!testObj.children.length) console.log();
        }
    }
}

// Create a new object, that prototypally inherits from the Error constructor
function MyError(message, stack) {
  this.name = 'MyError';
  this.message = message;
  this.stack = stack;
}
MyError.prototype = Object.create(Error.prototype);
MyError.prototype.constructor = MyError;

//print pure red error
function printError (testObj) {
    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + testObj.title, 'color: red; font-weight: normal');
        if (testObj.error) {
            console.groupCollapsed('%c' + testObj.error.message, 'color: red; font-weight: normal');
            console.error(testObj.stack);
            console.groupEnd();
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(testObj) + ' × ') + chalk.red(testObj.title));

        //NOTE: node prints e.stack along with e.message
        if (testObj.error.stack) {
            var stack = testObj.error.stack.replace(/^\s*/gm, indent(testObj) + '   ');
            console.error(chalk.gray(stack));
        }
    }
}

//print green success
function printSuccess (testObj, single) {
    if (isBrowser) {
        if (single) {
            console.log('%c√ ' + testObj.title + '%c  ' + testObj.time.toFixed(2) + 'ms', 'color: green; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
        } else {
            printGroup(testObj);
        }
    }
    else {
        if (!single) {
            printGroup(testObj);
        }
        else {
            console.log(chalk.green(indent(testObj) + ' √ ') + chalk.green.dim(testObj.title) + chalk.gray(' ' + testObj.time.toFixed(2) + 'ms'));
        }
    }
}

//print yellow warning (not all tests are passed or it is container)
function printGroup (testObj) {
    if (isBrowser) {
        console.group('%c+ ' + testObj.title + '%c  ' + testObj.time.toFixed(2) + 'ms', 'color: orange; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log();
        console.log(indent(testObj) +' ' + chalk.yellow('+') + ' ' + chalk.yellow(testObj.title) + chalk.gray(' ' + testObj.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
function printSkip (testObj, single) {
    if (isBrowser) {
        console[single ? 'log' : 'group']('%c- ' + testObj.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(testObj) + ' - ') + chalk.cyan.dim(testObj.title));
    }
}


//return indentation of for a test, based on nestedness
function indent (testObj) {
    var parent = testObj.parent;
    var str = '';
    while (parent) {
        str += test.INDENT;
        parent = parent.parent;
    }
    return str;
}


//skip alias
test.skip = function skip (message) {
   return test(message);
};

//only alias
test.only = function only (message, fn) {
    //indicate that only is detected, except for the case of intentional run
    if (fn) test.DETECT_ONLY = false;
    //change only mode to true
    test.ONLY_MODE = true;
    test(message, fn, true);
    return test;
}

//more obvious chain
test.test = test;


module.exports = test;