# deduplication.js

Tries to assume whether data is duplicated, how much and tries to clean up duplication,
but there are couple of checks before function does its job to try to mitigate possibility
that duplicity didn't occur.

'aabb' -> 'ab'
'aabbc' -> 'aabbc'

Call it like this:

```javascript
deduplicate(input: any): string;
```
