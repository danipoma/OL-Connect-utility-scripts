# mappingHelper_PDF.js

Contains utility functions for Objectif Lune's PlanetPress Connect Application (DataMapper) - PDF mapper format.

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

Where would you use this function?

For example you are extracting lines and want to exclude additional costs, but that text might not be on same line,
it might have broken off to next page.

Previously you had to loop through all lines and save them in array, make some checks to filter out unneeded information,
then populate those records into your result set.

You could use `data.moveTo()`, but it has only two move possibilities:

- Move by page (which isn't useful to your case) since you also have be able to move to correct height to continue looping from previous position
- Move by index that is calculated from first page, which is unusuable to your case, because index from top can't be naively implemented since PDF can have multiple sizes on different pages.

This solves your issue.

Those methods are bounds checked and normalized in case you under/overshoot your input.

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

Additionally I added static method for finding text position.
It searches 100mm from your current position forward for text you specify.

```javascript
PDF.findTextPosition(search: RegExp | string, height: number | null | undefined): { left: number, right: number, offset: number };
```
