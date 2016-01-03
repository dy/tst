var chalk = require('chalk');
var isBrowser = require('is-browser');

var tab = '   ';
var indent = ' ';


function test(message, testFunction) {
    if (!testFunction) {
        if (typeof message === 'string') return skip(message);

        testFunction = message;
        message = message.name;
    }

    try{
        testFunction.call();

        if (isBrowser) {
            console.log('%c√ ' + message, 'color: green');
        }
        else {
            console.log(chalk.green(indent, '√', message));
        }
    } catch(e) {

        //Leave formatting to browser
        if (isBrowser) {
            console.group('%c× ' + message, 'color: red');
            console.error(e);
            console.groupEnd();
        }
        else {
            console.log(chalk.red(indent, '×', message));
            console.error(chalk.gray(tab, e.message, e.stack));
        }
    }
}

function skip (message) {
    if (isBrowser) {
        console.log('%c- ' + message, 'color: blue');
    }
    else {
        console.log(chalk.cyan(indent, '-', message));
    }
}


test.skip = skip;

module.exports = test;