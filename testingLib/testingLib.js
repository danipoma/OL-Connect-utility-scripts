/**
 * @public
 * @typedef {Object} Test
 * @constructor
 * @constructs Test
 */
function Test(
    /** @type {function} */
    fn,
    /** @type {string | null | undefined} */
    description) {
    this.name = 'Test';

    if (!(typeof fn === 'function')) {
        throw new TypeError('Expected function, got ' + typeof fn);
    }

    // We need to check if we can assert result
    {
        let res;
        try {
            res = fn();
        } catch (error) {
            res = true;
        }

        if (!(typeof res === 'boolean')) {
            throw new Error(this.name + ' should either throw or evaluate to boolean, got ' + typeof res);
        }
    }

    this._fn = fn;

    if (description === null || description === undefined) {
        description = this.name + ' description not specified'
    }


    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;

    this._passFn;
    this._passed;
}

/** @public */
Test.prototype.setDescription = function (
    /** @type {string} */
    description
) {
    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;

    return this;
}

/** @public */
Test.prototype.passedOtherwiseThrow = function (
    /** @type {string | null | undefined} */
    description
) {
    if (description === null || description === undefined) {
        description = this._description;
    }

    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    if (this._passed === null || this._passed === undefined) {
        throw new Error('Test had not been run, so we can\'t throw based on test result yet.');
    }

    if (this._passed === true) {
        return;
    }

    throw new Error(description);
}

/** @public */
Test.prototype.run = function () {
    if (this._passFn === null || this._passFn === undefined) {
        throw new Error(this.name + ' was not set to what is expected to happen');
    }

    this._passFn();
    log(this.getTestResponse());

    return this;
}

/** @public */
Test.prototype.testPassed = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test result cannot be provided');
    }

    return this._passed;
}

/** @public */
Test.prototype.getTestResponse = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test response cannot be provided');
    }

    let testResponse;

    if (this._passed === true) {
        testResponse = this.name + ': ✅ ' + this._description;
    }

    if (this._passed === false) {
        testResponse = this.name + ': ❌ ' + this._description;
    }

    return testResponse;
}

/** @public */
Test.prototype.shouldBeTrue = function () {
    this._passFn = function () {
        try {
            let res = this._fn();
            if (res === true) {
                this._passed = true;
            } else {
                this._passed = false;
            }
        } catch (error) {
            this._passed = false;
        }

        return this._passed;
    }

    return this;
}

/** @public */
Test.prototype.shouldBeFalse = function () {
    this._passFn = function () {
        try {
            let res = this._fn();
            if (res === false) {
                this._passed = true;
            } else {
                this._passed = false;
            }
        } catch (error) {
            this._passed = false;
        }

        return this._passed;
    }

    return this;
}

/** @public */
Test.prototype.shouldThrow = function () {
    this._passFn = function () {
        try {
            this._fn();
            this._passed = false;
        } catch (error) {
            this._passed = true;
        }

        return this._passed;
    }

    return this;
}

/** @public */
Test.prototype.shouldNotThrow = function () {
    this._passFn = function () {
        try {
            this._fn();
            this._passed = true;
        } catch (error) {
            this._passed = false;
        }

        return this._passed;
    }

    return this;
}

/**
 * @public
 * @typedef {Object} TestCase
 * @constructor
 * @constructs TestCase
 */
function TestCase(
    /** @type {string | null | undefined} */
    description) {
    this.name = 'Test case'

    if (description === null || description === undefined) {
        description = this.name + ' description not specified'
    }

    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;

    this._passFn;
    this._passed;
    this._tests = [];
}

/** @public */
TestCase.prototype.setDescription = function (
    /** @type {string} */
    description
) {
    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;

    return this;
}

/** @public */
TestCase.prototype.passedOtherwiseThrow = function (
    /** @type {string | null | undefined} */
    description
) {
    if (description === null || description === undefined) {
        description = this._description;
    }

    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    if (this._passed === null || this._passed === undefined) {
        throw new Error('Test had not been run, so we can\'t throw based on test result yet.');
    }

    if (this._passed === true) {
        return;
    }

    throw new Error(description);
}

/** @public */
TestCase.prototype.run = function () {
    if (this._passFn === null || this._passFn === undefined) {
        throw new Error(this.name + ' was not set to what is expected to happen');
    }

    log('Running ' + this.name.toLowerCase() + ': ' + this._description);

    this._tests.forEach((test) => test.run());

    this._passFn();
    log(this.getTestResponse());

    return this;
}

/** @public */
TestCase.prototype.testPassed = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test result cannot be provided');
    }

    return this._passed;
}

/** @public */
TestCase.prototype.getTestResponse = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test response cannot be provided');
    }

    let testResponse;

    if (this._passed === true) {
        testResponse = this.name + ': ✅ ' + this._description;
    }

    if (this._passed === false) {
        testResponse = this.name + ': ❌ ' + this._description;
    }

    return testResponse;
}

/** @public */
TestCase.prototype.addTest = function (
    /** @type {Test} */
    test
) {
    if (!(test instanceof Test)) {
        throw new TypeError('Expected Object(Test), got ' + typeof test);
    }

    this._tests.push(test);

    return this;
}

/** @public */
TestCase.prototype.allPassed = function () {
    this._passFn = function () {
        this._passed = this._tests.every((test) => test._passed === true);

        return this._passed;
    }

    return this;
}

/** @public */
TestCase.prototype.atLeastOnePassed = function () {
    this._passFn = function () {
        this._passed = this._tests.some((test) => test._passed === true);

        return this._passed;
    }

    return this;
}

/**
 * @public
 * @typedef {Object} TestController
 * @constructor
 * @constructs TestController
 */
function TestController(
    /** @type {string | null | undefined} */
    description) {
    this.name = 'Test controller';

    if (description === null || description === undefined) {
        description = this.name + ' description not specified'
    }

    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;


    this._passFn;
    this._passed;
    this._testCases = [];
}

/** @public */
TestController.prototype.setDescription = function (
    /** @type {string} */
    description
) {
    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    this._description = description;

    return this;
}

/** @public */
TestController.prototype.passedOtherwiseThrow = function (
    /** @type {string | null | undefined} */
    description
) {
    if (description === null || description === undefined) {
        description = this._description;
    }

    if (!(typeof description === 'string')) {
        throw new TypeError('Expected string, got ' + typeof description);
    }

    if (this._passed === null || this._passed === undefined) {
        throw new Error('Test had not been run, so we can\'t throw based on test result yet.');
    }

    if (this._passed === true) {
        return;
    }

    throw new Error(description);
}

/** @public */
TestController.prototype.run = function () {
    if (this._passFn === null || this._passFn === undefined) {
        throw new Error(this.name + ' was not set to what is expected to happen');
    }

    log('Running ' + this.name.toLowerCase() + ': ' + this._description);

    this._testCases.forEach((testCase) => testCase.run());

    this._passFn();
    log(this.getTestResponse());

    return this;
}

/** @public */
TestController.prototype.testPassed = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test result cannot be provided');
    }

    return this._passed;
}

/** @public */
TestController.prototype.getTestResponse = function () {
    if (this._passed === null || this._passed === undefined) {
        throw new Error(this.name + ' is not completed, so test response cannot be provided');
    }

    let testResponse;

    if (this._passed === true) {
        testResponse = this.name + ': ✅ ' + this._description;
    }

    if (this._passed === false) {
        testResponse = this.name + ': ❌ ' + this._description;
    }

    return testResponse;
}

/** @public */
TestController.prototype.addTestCase = function (
    /** @type {TestCase} */
    testCase
) {

    if (!(testCase instanceof TestCase)) {
        throw new TypeError('Expected Object(TestCase), got ' + typeof testCase);
    }

    this._testCases.push(testCase);

    return this;
}

/** @public */
TestController.prototype.allPassed = function () {
    this._passFn = function () {
        this._passed = this._testCases.every((testCase) => testCase._passed === true);

        return this._passed;
    }

    return this;
}

/** @public */
TestController.prototype.atLeastOnePassed = function () {
    this._passFn = function () {
        this._passed = this._testCases.some((testCase) => testCase._passed === true);

        return this._passed;
    }

    return this;
}

function log(
    message
) {
    try {
        logger.info === undefined;
        logger.info(message);
        return;
    } catch (error) { }

    try {
        console.log === undefined;
        console.log(message);
        return;
    } catch (error) { }

    throw new Error("Logger is not available");
}
