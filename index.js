var chalk = require('chalk');
var isBrowser = require('is-browser');

var tab = '    ';
var indent = '  ';

function test(message, testFunction) {
    if (!testFunction) {
        testFunction = message;
        message = '';
    }
    try{
        testFunction.call();
        console.log(chalk.green(indent, '√', message));
    } catch(e) {
        console.log(chalk.red(indent, '×', message));

        //Leave formatting errors for browser
        if (isBrowser) {
            console.error(e);
        }
        //Node console is not that goof
        else {
            console.error(chalk.gray(tab, e.message, e.stack));
        }
    }
}

test.skip = function (message, testFunction) {
    console.log(chalk.cyan(indent, '-', message));
}

module.exports = test;
