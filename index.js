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
        console.log(chalk.green(indent, '%c√', message), 'color: green');
    } catch(e) {
        console.log(chalk.red(indent, '%c×', message), 'color: red');

        //Leave formatting to browser
        if (isBrowser) {
            console.error(e);
        }
        else {
            console.error(chalk.gray(tab, e.message, e.stack));
        }
    }
}

function skip (message) {
    console.log(chalk.cyan(indent, '%c-', message), 'color: blue');
}


test.skip = skip;

module.exports = test;