# FAQ

## Why script is not written in modern javascript?
OL Connect / Planetpress JS engine doesn't have modern features built in (const, classes etc.),
that is why script might seem archaic.

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
- Contains utility functions for Objectif Lune's PlanetPress Connect Application - Excel mapper format.

Methods/Functions meant for public use are decorated with @public keyword.

There are couple of public minor helper methods:
```javascript
mappingHelper.getLastColumnName(): string;
mappingHelper.getFirstColumnName(): string;
mappingHelper.getColumnName(columnIndex: number): string;
```

But main reason I created this mappingHelper is this method:
```javascript
mappingHelper.findCell(search: string | RegExp, startRowOffset: ?number, stopRowOffset: ?number);
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
- Contains utility functions for Objectif Lune's PlanetPress Connect Application - PDF mapper format.

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
You could use data.moveTo(), but it has only two move possibilities:
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
