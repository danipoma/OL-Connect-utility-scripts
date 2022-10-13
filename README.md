# FAQ

## Why script is not written in modern javascript?
OL Connect / Planetpress JS engine doesn't have modern features built in (const, classes etc.),
that is why script might seem archaic.

## Scripts are not following clean code / are not DRY
I know that they might be messy sometimes, I might not be using best patterns and
I could extract some blocks of code to functions to follow DRY, however I am human being
that sometimes misses that and when you don't want to refactor things endlessly, 
you just have to end it somewhere.

It is not production-grade program, just a script and even then I have seen some stories,
so it can get much worse than this.

If it bothers you, you can rewrite it, maybe even send in PR, however it doesn't take in
any priority to me, it is just used for quick and dirty job.

And if I did write it in 100% fully top-notch style, it is entirely possible
that people trying to use this might get confused how this even works with all that
indirection, delegation and whatsnot in cause of scalability and redundancy reduction.

Don't aim for squeaky clean code, otherwise it will make you mad even more than it normally 
would when colleague makes a change that could be considered messy.

# Scripts for OL Connect / Planetpress

## deduplication.js
- Tries to assume whether data is duplicated, how much and tries to clean up duplication.

I had seen various formats, I have seen companies trying to order goods that were
in .wcf format. I had seen PDF that had 24 MB and after minification, it became 200 KB.
And I had seen PDF that were not readable normally and Planetpress sometimes duplicates 
various texts (bold text for example, but even all of it) and that's when this script 
comes in.

## mappingHelper_Excel.js
- Contains utility functions for Excel mapper format.

There are quite a lot of "private" methods (starting with _), but because
prototypes don't have a formal concept of private, it can still be used nevertheless.

I know that it is possible to emulate private behavior in certain sense, but it makes
things even more unreadable and since I know it will be used only internally and it
doesn't change data in some other service, it is not needed to go that far.

It contains getFirstColumnName() and getLastColumnName() public methods mostly
to test some column span (and if it works) and it can be also sometimes useful.

Most useful function currently is findCell() - see implementation.

Currently Excel only work using offsets (although there are index <--> offset converters
laid down due to implementation and also in case I would also want to provide methods using index).

However since when you are processing document, you are mostly interested in content around current
context, I don't see how much useful would be make index-based methods since you still have to know
it's location and that it is not out of bounds.

