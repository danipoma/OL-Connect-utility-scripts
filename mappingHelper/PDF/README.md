# mappingHelper_PDF.js

Contains utility functions for Objectif Lune's PlanetPress Connect Application (DataMapper) - PDF mapper format.

Methods/Functions meant for public use are decorated with @public keyword.

There are couple of minor helper methods:

```javascript
mappingHelper.getCurrentHeight(): number;
mappingHelper.getCurrentPageNumber(): number;
mappingHelper.getRecordCoordinates(page: number, height: number): RecordCoordinates;
mappingHelper.getCurrentPosition(): RecordCoordinates;
```

But main reason I created this mappingHelper are these methods:

```javascript
mappingHelper.moveTo(page: RecordIndex | RecordCoordinates | number, height: ?number): void;
mappingHelper.moveBy(offset: number): void;
PDF.findTextPosition(search: RegExp | string, height: ?number, maxOffset: ?number): { left: number, right: number, offset: number };
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

Simply call this code to save your current position:

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

You can also use `moveBy()` method if you prefer to move relative to your current position.

```javascript
mappingHelper.moveBy(offset);
```

Additionally I added static method for finding text position since I had issues using `data.find()` or `data.findRegExp()`.
Sometimes it just reported values in wrong positions or it didn't find it at all.

It searches 100mm from your current position forward for text you specify.
Also there isn't support for multi-line searching since `data.extract()` that software supplier provides and we use for text extraction extracts content information based on line-by-line. It is not column-aware. We would have to redo how we search that content, but currently there isn't any need for time being.

To reiterate - if you would want to find location of `a y`, but in PDF it would be formatted as such:

```plaintext
a a a
x y z
```

Then it would not find it, because `data.extract()` would output it as `a a a<line-separator>x y z` and not `a<text-break>x a<text-break>y a<text-break>z`

You can provide RegExp pattern or string and optionally you can provide argument (height) that will specify which height your line that you search has.
By default it is set to 4.

```javascript
PDF.findTextPosition(search)
```
