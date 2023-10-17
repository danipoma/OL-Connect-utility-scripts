# mappingHelper_Excel.js

Contains utility functions for Objectif Lune's PlanetPress Connect Application (DataMapper) - Excel mapper format.

Methods/Functions meant for public use are decorated with @public keyword.

There are couple of public minor helper methods:

```javascript
mappingHelper.getLastColumnName(): string;
mappingHelper.getFirstColumnName(): string;
mappingHelper.getColumnName(columnIndex: number): string;
mappingHelper.getRowAtRowOffset(rowOffset: ?number, excludeBlankCells: ?boolean): string[];
```

But main reason I created this mappingHelper is this method:

```javascript
mappingHelper.findCell(search: string | RegExp, startRowOffset: ?number, stopRowOffset: ?number): Cell | null;
```

null is being returned in mappingHelper.findCell if nothing was found.

It handles multiple scenarios to give you pointers on where your data is.

Excel has different amount of columns?
Column are changing their order?
Column has different names?
You don't know on which line your header line starts?

This solves your problem.

It is bounds checked, so you shouldn't be able to get Out of Bounds Exception,
so in case you overshoot your input, it will get normalized to current bounds.

You can specify how many lines it should search through before giving up
(throws an exception if it didn't find anything).

If you don't specify range of search, it will assume to search from your position
to next 100 lines (unless there are less lines).
