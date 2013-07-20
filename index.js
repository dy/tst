function test(message, testFunction) {
    if (!testFunction) {
        testFunction = message;
        message = '';
    }
    try{
        testFunction.call();
        console.log('PASSED', message);
    } catch(e) {
        console.error('FAILED', message);
        console.error(e.message);
        console.error(e.stack);
    }
}

module.exports = test;
