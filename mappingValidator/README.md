# mappingValidator.js

Tries to do basic validation per field it is set to check. This script is
already set up to check multiple document types (not file types), but you
need to specify which document type we are trying to validate at the end
of this script since it contains both implementation and initialization
for ease of use.

Those document types are what is to be checked is initialized automatically
in

```javascript
Validator.prototype._initializeHeaderFields();
Validator.prototype._initializeLineFields();
```

Call it like this:

```javascript
// Tell validator which order type we will be validating (like OC, EU-SN, ASIA-SN, DWNP, PO, QUOTATION)
let mappingValidator = new Validator('PO');
```
