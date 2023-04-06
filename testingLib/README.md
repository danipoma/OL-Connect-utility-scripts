# testingLib.js

- Implements some basic testing functionality that can be used to validate
field information even further if need be.

We expect function on the input when constructing Test,
so we can run it when needed.

You also need to set up like what is considered to be passing test.

You can also set up optional things like description during construction
or with setDescription method.

After all these things are set, you can start it with x.run()
and afterwards retrieve information about test response (x.getTestResponse())
or boolean representation of result (x.testPassed()).

You can also say to throw if it didn't pass with x.passedOtherwiseThrow()

Call it like this:

```javascript
// Test Example
new TestController()
    .addTestCase(
        new TestCase()
            .addTest(new Test(() => false).shouldBeFalse())
            .addTest(new Test(() => true).shouldBeFalse())
            .allPassed())
    .addTestCase(
        new TestCase()
            .addTest(new Test(() => false).shouldBeFalse())
            .addTest(new Test(() => true).shouldBeTrue())
            .addTest(new Test(() => { throw new Error('bla') }).shouldThrow())
            .addTest(new Test(() => { throw new Error('bla') }).shouldNotThrow())
            .allPassed())
    .setDescription("All test cases should pass")
    .allPassed()
    .run()
    .testPassed();

// Test Example
new TestCase()
    .addTest(new Test(() => false).shouldBeFalse())
    .addTest(new Test(() => true).shouldBeTrue())
    .addTest(new Test(() => { throw new Error('bla') }).shouldThrow())
    .addTest(new Test(() => { throw new Error('bla') }).shouldNotThrow())
    .atLeastOnePassed()
    .run()
    .testPassed();

// Test Example
new Test(() => false).setDescription("Should be false").shouldBeFalse().run().testPassed();
new Test(() => { throw new Error('bla') }).shouldThrow().run().testPassed();
new Test(() => { throw new Error('bla') }).shouldNotThrow().run();
new Test(() => true).shouldBeFalse().run().passedOtherwiseThrow();
```
