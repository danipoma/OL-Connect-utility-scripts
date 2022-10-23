# FAQ

## Why script is not written in modern javascript?
OL Connect / Planetpress JS engine doesn't have modern features built in (const, classes etc.),
that is why script might seem archaic.

# Tips & Tricks
## Complex scripts in Location Mode
In that mode, you are restricted to method chaining.

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

# Scripts for OL Connect / Planetpress

## deduplication.js
- Tries to assume whether data is duplicated, how much and tries to clean up duplication,
but there are couple of checks before function does it's job to try to mitigate possibility
that duplicity didn't occur.

'aabb' -> 'ab'  
'aabbc' -> 'aabbc'

Call it like this:
```javascript
deduplicate(input: any): string;
```

## mappingHelper_Excel.js
- Contains utility functions for Objectif Lune's PlanetPress Connect Application (DataMapper) - Excel mapper format.

Methods/Functions meant for public use are decorated with @public keyword.

There are couple of public minor helper methods:
```javascript
mappingHelper.getLastColumnName(): string;
mappingHelper.getFirstColumnName(): string;
mappingHelper.getColumnName(columnIndex: number): string;
```

But main reason I created this mappingHelper is this method:
```javascript
mappingHelper.findCell(search: string | RegExp, startRowOffset: ?number, stopRowOffset: ?number): Cell;
```

It handles multiple scenarios to give you pointers on where your data is.

Excel has different amount of columns?  
Column are changing their order?  
Column has different names?  
You don't know on which line your header line starts?  

This solves your problem.

It is bounds checked, so you shouldn't be able to get Out of Bounds Exception,
you can specify how many lines it should search through before giving up
(throws an exception if it didn't find anything).

If you don't specify range of search, it will assume to search from your position
to next 100 lines (unless there are less lines).

## mappingHelper_PDF.js
- Contains utility functions for Objectif Lune's PlanetPress Connect Application (DataMapper) - PDF mapper format.

Methods/Functions meant for public use are decorated with @public keyword.

There are couple of minor helper methods:

```javascript
mappingHelper.getCurrentHeight(): number;
mappingHelper.getCurrentPageNumber(): number;
mappingHelper.getRecordCoordinates(page: number, height: number): RecordCoordinates;
```

But main reason I created this mappingHelper are these methods:

```javascript
mappingHelper.getCurrentPosition(): RecordCoordinates;
mappingHelper.moveTo(page: RecordCoordinates | number, height: ?number): void;
```

For example you are extracting lines and want to exclude additional costs, but that text might not be on same line,
it might have broken off to next page.

Previously you had to loop through all lines and save them in array to then populate them into your result set afterwards.
You could use `data.moveTo()`, but it has only two move possibilities:
- Move by page (which isn't useful to your case)
- Move by index that is calculated from first page, which is nonsensical to your case also, because index from top can't 
be naively implemented since PDF can have multiple sizes on different pages.

This solves your issue.

Simply call this code to save your current position;

```javascript
let curPos = mappingHelper.getCurrentPosition();
```

And when you are ready to return back, call:
```javascript
mappingHelper.moveTo(curPos);
```

If you want to specify page and height instead, you can do that also:
```javascript
mappingHelper.moveTo(page, height);
```
