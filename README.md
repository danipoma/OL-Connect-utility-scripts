# FAQ

## Why script is not written in modern javascript?

OL Connect / Planetpress JS engine doesn't have modern features built in (const, classes etc.),
that is why script might seem archaic.

# Tips & Tricks

## Complex scripts in Location Mode

In that mode you are not allowed to use statements.

However we can break ourselves free like this:

```javascript
split().map(x => {
// I am free!
let a = 5;
let b = 10;
return a + b;
})[0];
```

You can use what we extracted (variable `x`) and you can also see what region it gathered,
so if you need to do some complex logic, you can do it in location-based extraction
and still get added benefits.

And there is no limitation. If you want to gather multiple locations through `data.extract()`,
you certainly can.

It is working just like script-based extraction, but you get visibility of one region on top of it.

## Adjust record information field multiple times

PlanetPress DataMapper allows you to extract certain field only once per record.

You can however use Action Step.

You can access current record (if in loop) like this:

```javascript
record.tables.detail[steps.currentLoopCounter-1].fields.YourField = 'Your New Value';
```

Just note that you can't save this path to variable since it copies value instead of making a reference to it.

But I would refrain from using `steps.currentLoopCounter` as it doesn't give you intellisense on your fields
and also limits your possibilities of use.

Rather create counter variable and increase count every time you find a new record.

```javascript
let recordCnt = -1;
```

Then increase it at some point:

```javascript
recordCnt++;
```

Then finally use it:

```javascript
record.tables.detail[recordCnt].fields.YourField = 'Your New Value';
```

By using it like that, you can restrain some parts of your gathering based on your `recordCnt` state,
you can also have secondary variable and have calculation logic that would allow line splitting etc.
