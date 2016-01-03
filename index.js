var chalk = require('chalk');
var isBrowser = require('is-browser');

var INDENT = '  ';
var indentCount = 0;
var testCount = 0;

function test(message, testFunction) {
    indentCount++;
    testCount++;

    if (!testFunction) {
        if (typeof message === 'string') {
            indentCount--;

            if (isBrowser) {
                console.log('%c- ' + message, 'color: blue');
            }
            else {
                console.log(chalk.cyan(indent(indentCount + 1), '-', message));
            }

            return;
        }

        testFunction = message;
        message = message.name;
        if (!message) message = 'Test #' + testCount;

    }

    try{
        testFunction.call();

        if (isBrowser) {
            console.log('%c√ ' + message, 'color: green');
        }
        else {
            console.log(chalk.green(indent(indentCount), '√', message));
        }
    } catch(e) {

        //Leave formatting to browser, it shows errors better
        if (isBrowser) {
            console.group('%c× ' + message, 'color: red');
            console.error(e);
            console.groupEnd();
        }
        else {
            console.log(chalk.red(indent(indentCount), '×', message));

            //NOTE: node prints e.stack along with e.message
            console.error(chalk.gray(indent(indentCount), e.stack));
        }
    }

    indentCount--;
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