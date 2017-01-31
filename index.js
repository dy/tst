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
var inherits = require('inherits');
var Emitter = require('events');
var extend = require('xtend/mutable');
var inspect = require('util-inspect')


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
    var testObj = new Test({
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
    });

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

    //register children - supposed that parent will run all the children after fin
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

    return testObj;
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
    currentTest.exec();

    //at the moment test is run, we know all it’s children
    //push all the children to the queue, after the current test
    //FIXME: this guy erases good stacktrace :< Maybe call asyncs last?
    var children = currentTest.children;

    //mind the case if no only children test is selected - run them all instead of none
    if (children.every(function (child) {return !child.only})) {
        children.forEach(function (child) {
            child.only = true;
        });
    }

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
 * A test object constructor
 */
function Test (opts) {
    extend(this, opts);
}

inherits(Test, Emitter);


/**
 * Call before exec
 */
Test.prototype.after = function (cb) {
    this.once('after', cb);
    return this;
};

/**
 * Call after exec
 */
Test.prototype.before = function (cb) {
    this.once('before', cb);
    return this;
};

/**
 * Bind promise-like
 */
Test.prototype.then = function (resolve, reject) {
    this.once('success', resolve);
    this.once('error', reject);
    return this;
};

/**
 * Mocha-compat timeout setter
 */
Test.prototype.timeout = function (value) {
    if (value == null) return this._timeout;
    if (value === false) this._timeout = test.MAX_TIMEOUT;
    else if (value === Infinity) this._timeout = test.MAX_TIMEOUT;
    else this._timeout = value;
    return this;
}

/**
 * Prototype props
 *
 * @True {[type]}
 */
extend(Test.prototype, {
    id: testCount,
    title: 'Undefined test',

    //pending, success, error, group
    status: null,

    //test function
    fn: null,

    //nested tests
    children: [],

    //whether test should be resolved
    async: undefined,

    //whether the test is last child within the group
    last: false,

    //timeout for the async
    _timeout: test.TIMEOUT,

    //whether the test is the only to run (launched via .only method)
    only: false,

    //whether the test was started in deferred fashion
    //it can be sync, but launched after async
    deferred: DEFERRED
});

/**
 * Execute main test function
 */
Test.prototype.exec = function () {
    var self = this;

    //ignore skipping test
    if (self.status === 'skip') {
        self.promise = Promise.resolve();
        self.print();
        return self;
    }

    //save test to the chain
    tests.push(self);

    //display title of the test
    self.printTitle();

    //timeout promise timeout id
    var toId;

    //prepare test
    self.emit('before');

    //exec sync test
    if (!self.async) {
        self.promise = Promise.resolve();

        var time;
        try {

            self.time = now();
            var result = self.fn.call(self);
            time = now() - self.time;

        } catch (e) {
            self.fail(e);
        }

        //if the result is promise - whoops, we need to run async
        if (result && result.then) {
            self.async = true;
            self.promise = result;
            //FIXME: this guy violates the order of nesting
            //because so far it was thought as sync
            self.execAsync();
        }

        //if result is not error - do finish
        else {
            self.time = time;
            self.emit('after');

            if (!self.error) {
                if (!self.status !== 'group') self.status = 'success';

                self.emit('success');
                self.print();
            }
        }

    }
    else {
        self.execAsync();
    }

    //after promise’s executor, but before promise then’s
    //so user can’t create tests asynchronously, they should be created at once
    tests.pop();

    return self;
};


/*
 * Exec async test - it should be run in promise
 * sorry about the stacktrace, nothing I can do...
 */
Test.prototype.execAsync = function () {
    var self = this;

    //if promise is already created (by user) - race with timeout
    //FIXME: add time measure
    if (self.promise) {
        self.promise = Promise.race([
            self.promise,
            new Promise(execTimeout)
        ]);
    }
    //else - invoke function
    else {
        self.promise = Promise.race([
            new Promise(function (resolve, reject) {
                self.status = 'pending';
                self.time = now();
                return self.fn.call(self, resolve);
            }),
            new Promise(execTimeout)
        ])
    }

    self.promise.then(function () {
        self.time = now() - self.time;

        clearTimeout(toId);
        if (self.status !== 'group') self.status = 'success';

        self.emit('after');
        self.emit('success');

        self.print();
    }, function (e) {
        self.fail(e)
    });

    function execTimeout (resolve, reject) {
        toId = setTimeout(function () {
            reject(new Error('Timeout ' + self._timeout + 'ms reached. Please fix the test or set `this.timeout(' + (self._timeout + 1000) + ');`.'));
        }, self._timeout);
    }
};


/**
 * Resolve to error (error handler)
 */
Test.prototype.fail = function (e) {
    var self = this;

    if (typeof e !== 'object') e = Error(e);

    //grab stack (the most actual is here, further is mystically lost)
    self.stack = e.stack;

    //set flag that bundle is failed
    test.ERROR = true;

    var parent = self.parent;
    while (parent) {
        parent.status = 'group';
        parent = parent.parent;
    }

    //update test status
    self.status = 'error';
    self.error = e;

    self.emit('fail', e);

    self.print();
};


Test.prototype.printTitle = function () {
    var self = this;

    if (!isBrowser) {
        var frame = elegantSpinner();

        //print title (indicator of started, now current test)
        updateTitle();
        self.titleInterval = setInterval(updateTitle, 50);

        //update title frame
        function updateTitle () {
            //FIXME: this is the most undestructive for logs way of rendering, but crappy
            process.stdout.write(ansi.cursorLeft);
            process.stdout.write(ansi.eraseEndLine);
            process.stdout.write(chalk.white(indent(self) + ' ' + frame() + ' ' + self.title) + test.INDENT);
            // logUpdate(chalk.white(indent(test.indent) + ' ' + frame() + ' ' + test.title));
        }
    }
}
//clear printed title (node)
Test.prototype.clearTitle = function () {
    if (!isBrowser && this.titleInterval) {
        clearInterval(this.titleInterval);
        process.stdout.write(ansi.cursorLeft);
        process.stdout.write(ansi.eraseEndLine);
    }
}

//universal printer dependent on resolved test
Test.prototype.print = function () {
    var self = this;

    this.clearTitle();

    var single = self.children && self.children.length ? false : true;

    if (self.status === 'error') {
        self.printError();
    }
    else if (self.status === 'group') {
        self.printGroup(single);
    }
    else if (self.status === 'success') {
        self.printSuccess(single);
    }
    else if (self.status === 'skip') {
        self.printSkip(single);
    }

    //last child should close parent’s group in browser
    if (self.last) {
        if (isBrowser) {
            //if truly last - create as many groups as many last parents
            if (!self.children.length) {
                console.groupEnd();
                var parent = self.parent;
                while (parent && parent.last) {
                    console.groupEnd();
                    parent = parent.parent;
                }
            }
        } else {
            //create padding
            if (!self.children.length) console.log();
        }
    }
}

//print pure red error
Test.prototype.printError = function () {
    var self = this;

    //browser shows errors better
    if (isBrowser) {
        console.group('%c× ' + self.title, 'color: red; font-weight: normal');
        if (self.error) {
            if (self.error.name === 'AssertionError') {
                if (typeof self.error.expected !== 'object') {
                    var msg = '%cAssertionError:\n%c' + self.error.expected + '\n' + '%c' + self.error.operator + '\n' + '%c' + self.error.actual;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal', 'color: green; font-weight: normal', 'color: gray; font-weight: normal', 'color: red; font-weight: normal');
                }
                else {
                    var msg = '%cAssertionError: ' + self.error.message;
                    console.groupCollapsed(msg, 'color: red; font-weight: normal');
                }
                console.error(self.stack);
                console.groupEnd();
            }
            else {
                var msg = typeof self.error === 'string' ? self.error : self.error.message;
                console.groupCollapsed('%c' + msg, 'color: red; font-weight: normal');
                console.error(self.stack);
                console.groupEnd();
            }
        }
        console.groupEnd();
    }
    else {
        console.log(chalk.red(indent(self) + ' × ') + chalk.red(self.title));

        if (self.error.stack) {
            if (self.error.name === 'AssertionError') {
                var expected = inspect(self.error.expected)
                var actual = inspect(self.error.actual)
                console.error(chalk.gray('AssertionError: ') + chalk.green(expected) + '\n' + chalk.gray(self.error.operator) + '\n' + chalk.red(actual));
            } else {
                //NOTE: node prints e.stack along with e.message
                var stack = self.error.stack.replace(/^\s*/gm, indent(self) + '   ');
                console.error(chalk.gray(stack));
            }
        }
    }
}

//print green success
Test.prototype.printSuccess = function (single) {
    var self = this;

    if (isBrowser) {
        if (single) {
            console.log('%c√ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: green; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
        } else {
            self.printGroup();
        }
    }
    else {
        if (!single) {
            self.printGroup();
        }
        else {
            console.log(chalk.green(indent(self) + ' √ ') + chalk.green.dim(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
        }
    }
}

//print yellow warning (not all tests are passed or it is container)
Test.prototype.printGroup = function () {
    var self = this;

    if (isBrowser) {
        console.group('%c+ ' + self.title + '%c  ' + self.time.toFixed(2) + 'ms', 'color: orange; font-weight: normal', 'color:rgb(150,150,150); font-size:0.9em');
    }
    else {
        console.log();
        console.log(indent(self) +' ' + chalk.yellow('+') + ' ' + chalk.yellow(self.title) + chalk.gray(' ' + self.time.toFixed(2) + 'ms'));
    }
}

//print blue skip
Test.prototype.printSkip = function (single) {
    var self = this;

    if (isBrowser) {
        console[single ? 'log' : 'group']('%c- ' + self.title, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent(self) + ' - ') + chalk.cyan.dim(self.title));
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

    var result = test(message, fn, true);
    return result;
}

//more obvious chain
test.test = test;


module.exports = test;
