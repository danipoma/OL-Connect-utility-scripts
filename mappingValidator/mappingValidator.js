/**
* @public
* @typedef {Object} ValidatorOptions
* @constructor
* @constructs ValidatorOptions
*/
function ValidatorOptions(
    /** @type {object | null | undefined} */
    options) {
    if (options === null || options === undefined) {
        options = {};
    }

    if (!(typeof options === 'object')) {
        throw new TypeError('Expected object, got ' + typeof options);
    }

    // Check if options we pass are known to validator
    for (let opt in options) {
        if (!(ValidatorOptions.defaultOptions.hasOwnProperty(opt))) {
            throw new Error('Option "' + opt + '" is not valid');
        }

        let defaultOptionsOptType = typeof ValidatorOptions.defaultOptions[opt];
        let givenOptionsOptType = typeof options[opt];

        if (!(defaultOptionsOptType === givenOptionsOptType)) {
            throw new Error('Expected type "' + defaultOptionsOptType + '" on option "' + opt + '", got "' + givenOptionsOptType + '"');
        }
    }

    this.options = deepCopy(Object.assign(ValidatorOptions.defaultOptions, options));
}

/**
* @public
* @overloading
* @typedef {Object} Validator
* @constructor
* @constructs Validator
*/
function Validator(
    /** @type {string} */
    orderType,
    /** @type {ValidatorOptions | object | null | undefined} */
    options
) {
    if (!(typeof orderType === 'string')) {
        throw new TypeError('Expected string, got ' + typeof orderType);
    }

    if (options === null || options === undefined) {
        options = {};
    }

    if (!(typeof options === 'object')) {
        throw new TypeError('Expected object, got ' + typeof options);
    }

    if (!(options instanceof ValidatorOptions)) {
        options = new ValidatorOptions(options);
    }

    this._options = options;

    this._orderType = Validator.sanitizeOrderType(orderType);

    this._headerFields = new Map();
    this._lineFields = new Map();

    this._initializeHeaderFields();
    this._initializeLineFields();
}

/** @static */
ValidatorOptions.defaultOptions = {
    allowEmpty: false,
    allowSpecialOnly: false,
    allowJavascriptError: false,
    allowUndefined: false
}

/** @static */
Validator.recordIndexRange = {
    start: 0,
    end: function () {
        return record.tables.detail.length - 1;
    }
}

/** @static */
Validator.isRecordIndexWithinBounds = function (
    /** @type {number} */
    recordIndex
) {
    if (!(typeof recordIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof recordIndex);
    }

    if (recordIndex < Validator.recordIndexRange.start || recordIndex > Validator.recordIndexRange.end()) {
        return false;
    }

    return true;
}

/**
 * @public
 * @overloading
 */
Validator.prototype.upsertHeaderField = function (
    /** @type {string} */
    field,
    /** @type {ValidatorOptions | object | null | undefined} */
    options
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    if (field === '') {
        return
    }

    if (options === null || options === undefined) {
        options = this._options.options;
    }

    if (!(typeof options === 'object')) {
        throw new TypeError('Expected object, got ' + typeof options);
    }

    if (!(options instanceof ValidatorOptions)) {
        options = new ValidatorOptions(options);
    }

    this._headerFields.set(field.toLowerCase(), options);
}

/**
 * @public
 * @overloading
 */
Validator.prototype.excludeHeaderField = function (
    /** @type {string} */
    field
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    if (field === '') {
        return
    }

    this._headerFields.delete(field.toLowerCase());
}

/**
 * @public
 * @overloading
 */
Validator.prototype.upsertLineField = function (
    /** @type {string} */
    field,
    /** @type {ValidatorOptions | object | null | undefined} */
    options
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    if (field === '') {
        return
    }

    if (options === null || options === undefined) {
        options = this._options.options;
    }

    if (!(typeof options === 'object')) {
        throw new TypeError('Expected object, got ' + typeof options);
    }

    if (!(options instanceof ValidatorOptions)) {
        options = new ValidatorOptions(options);
    }

    this._lineFields.set(field.toLowerCase(), options);
}

/**
 * @public
 * @overloading
 */
Validator.prototype.excludeLineField = function (
    /** @type {string} */
    field
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    if (field === '') {
        return
    }

    this._lineFields.delete(field.toLowerCase());
}

/** @public */
Validator.prototype.validateHeaderField = function (
    /** @type {string} */
    field
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    let fieldList = this._headerFields;

    // Check for field existence
    if (!(fieldList.has(field))) {
        throw new Error('Header field "' + field + '" not found in validation list');
    }

    let fieldContents = record.fields[field];
    let errorResponseBase = 'Header field "' + field + '": "' + fieldContents + '"';

    if (!Validator.isUndefinedValid(fieldContents, fieldList.get(field).options.allowUndefined)) {
        throw new Error(errorResponseBase + ' is not extracted')
    }

    if (fieldContents === null || fieldContents === undefined) {
        return
    }

    fieldContents = fieldContents.toString();

    // Check if javascript error got stringified
    if (!Validator.isJavascriptErrorValid(fieldContents, fieldList.get(field).options.allowJavascriptError)) {
        throw new Error(errorResponseBase + ' has javascript error')
    }

    // Check if it contents have only special characters (non-meaningful information)
    if (!Validator.isSpecialOnlyValid(fieldContents, fieldList.get(field).options.allowSpecialOnly)) {
        throw new Error(errorResponseBase + ' contains only special characters')
    }

    if (!Validator.isEmptyValid(fieldContents, fieldList.get(field).options.allowEmpty)) {
        throw new Error(errorResponseBase + ' is empty')
    }
}

/** @public */
Validator.prototype.validateAll = function () {
    this.validateHeader();
    this.validateLines();
}

/** @public */
Validator.prototype.validateLineField = function (
    /** @type {string} */
    field,
    /** @type {number} */
    recordIndex
) {
    if (!(typeof field === 'string')) {
        throw new TypeError('Expected string, got ' + typeof field);
    }

    if (!(typeof recordIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof recordIndex);
    }

    let fieldList = this._lineFields;

    // Check for field existence
    if (!(fieldList.has(field))) {
        throw new Error('Line field "' + field + '" not found in validation list');
    }

    if (!Validator.isRecordIndexWithinBounds(recordIndex)) {
        throw new Error('Expected index to be within (' + Validator.recordIndexRange.start + ', ' + Validator.recordIndexRange.end() + '), got ' + recordIndex);
    }

    let fieldContents = record.tables.detail[recordIndex].fields[field];
    let errorResponseBase = 'Row ' + (recordIndex + 1) + ', line field "' + field + '": "' + fieldContents + '"';

    if (!Validator.isUndefinedValid(fieldContents, fieldList.get(field).options.allowUndefined)) {
        throw new Error(errorResponseBase + ' is not extracted')
    }

    if (fieldContents === null || fieldContents === undefined) {
        return
    }

    fieldContents = fieldContents.toString();

    // Check if javascript error got stringified
    if (!Validator.isJavascriptErrorValid(fieldContents, fieldList.get(field).options.allowJavascriptError)) {
        throw new Error(errorResponseBase + ' has javascript error')
    }

    // Check if it contents have only special characters (non-meaningful information)
    if (!Validator.isSpecialOnlyValid(fieldContents, fieldList.get(field).options.allowSpecialOnly)) {
        throw new Error(errorResponseBase + ' contains only special characters')
    }

    if (!Validator.isEmptyValid(fieldContents, fieldList.get(field).options.allowEmpty)) {
        throw new Error(errorResponseBase + ' is empty')
    }
}

/** @static */
Validator.isEmpty = function (
    /** @type {string} */
    content
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (content.length === 0) {
        return true;
    }

    return false;
}

/** @static */
Validator.isEmptyValid = function (
    /** @type {string} */
    content,
    /** @type {boolean | null | undefined} */
    allowEmpty
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (allowEmpty === null || allowEmpty === undefined) {
        allowEmpty = ValidatorOptions.defaultOptions.allowEmpty
    }

    if (!(typeof allowEmpty === 'boolean')) {
        throw new TypeError('Expected boolean, got ' + typeof allowEmpty);
    }

    if (allowEmpty) {
        return true;
    }

    return !this.isEmpty(content);
}

/** @static */
Validator.isSpecialOnly = function (
    /** @type {string} */
    content
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (content.match(/^\W+$/i) !== null) {
        return true;
    }

    return false;
}

/** @static */
Validator.isSpecialOnlyValid = function (
    /** @type {string} */
    content,
    /** @type {boolean | null | undefined} */
    allowSpecialOnly
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (allowSpecialOnly === null || allowSpecialOnly === undefined) {
        allowSpecialOnly = ValidatorOptions.defaultOptions.allowSpecialOnly
    }

    if (!(typeof allowSpecialOnly === 'boolean')) {
        throw new TypeError('Expected boolean, got ' + typeof allowSpecialOnly);
    }

    if (allowSpecialOnly) {
        return true;
    }

    return !this.isSpecialOnly(content);
}

/** @static */
Validator.isJavascriptError = function (
    /** @type {string} */
    content
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (content.match(/javascript/i) !== null) {
        return true;
    }

    return false;
}

/** @static */
Validator.isJavascriptErrorValid = function (
    /** @type {string} */
    content,
    /** @type {boolean | null | undefined} */
    allowJavascriptError
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (allowJavascriptError === null || allowJavascriptError === undefined) {
        allowJavascriptError = ValidatorOptions.defaultOptions.allowJavascriptError
    }

    if (!(typeof allowJavascriptError === 'boolean')) {
        throw new TypeError('Expected boolean, got ' + typeof allowJavascriptError);
    }

    if (allowJavascriptError) {
        return true;
    }

    return !this.isJavascriptError(content);
}

/** @static */
Validator.isUndefined = function (
    content
) {
    if (content === null || content === undefined) {
        return true;
    }

    return false;
}

/** @static */
Validator.isUndefinedValid = function (
    content,
    /** @type {boolean | null | undefined} */
    allowUndefined
) {
    if (allowUndefined === null || allowUndefined === undefined) {
        allowUndefined = ValidatorOptions.defaultOptions.allowUndefined
    }

    if (!(typeof allowUndefined === 'boolean')) {
        throw new TypeError('Expected boolean, got ' + typeof allowUndefined);
    }

    if (allowUndefined) {
        return true;
    }

    return !this.isUndefined(content)
}

/** @public */
Validator.prototype.validateHeader = function () {
    this._headerFields.forEach((_, fld) => this.validateHeaderField(fld));
}

Validator.prototype.validateLines = function () {
    if (Validator.recordIndexRange.end() < 0) {
        throw new Error('No order lines are being extracted');
    }

    for (let i = Validator.recordIndexRange.start, max = Validator.recordIndexRange.end(); i <= max; i++) {
        this.validateLine(i);
    }
}

/** @public */
Validator.prototype.validateLine = function (
    /** @type {number} */
    recordIndex
) {
    if (!(typeof recordIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof recordIndex);
    }

    this._lineFields.forEach((_, fld) => this.validateLineField(fld, recordIndex));
}

/** @static */
Validator.sanitizeOrderType = function (
    /** @type {string} */
    orderType) {

    if (!(typeof orderType === 'string')) {
        throw new TypeError('Expected string, got ' + typeof orderType);
    }

    switch (orderType.toLowerCase()) {
        case 'po':
        case 'purchaseorder':
        case 'order':
            return 'ORDER';

        case 'quotation':
        case 'offer':
            return 'QUOTATION';

        case 'oc':
        case 'orderconfirmation':
            return 'ORDERCONFIRMATION'

        case 'eu-sn':
        case 'eu-shippingnotification':
            return 'EUROPE-SHIPPINGNOTIFICATION';

        case 'asia-sn':
        case 'asia-shippingnotification':
            return 'ASIA-SHIPPINGNOTIFICATION';

        case 'dwnp':
        case 'dp':
        case 'downpayment':
            return 'DOWNPAYMENT';

        default:
            throw new Error('Order type "' + orderType + '" was not recognized');
    }
}

/** @private */
Validator.prototype._initializeHeaderFields = function () {
    switch (this._orderType) {
        case 'ORDER':
            this.upsertHeaderField('ShipToDeliverTO', { allowUndefined: true });
            this.upsertHeaderField('ShipToName', { allowUndefined: true });
            this.upsertHeaderField('ShipToStreet', { allowUndefined: true });
            this.upsertHeaderField('ShipToPostcalCode', { allowUndefined: true });
            this.upsertHeaderField('ShipToCity', { allowUndefined: true });
            this.upsertHeaderField('OrderDate');
            this.upsertHeaderField('OrderID');
            this.upsertHeaderField('CommentDelivery', { allowUndefined: true });
            break;

        case 'QUOTATION':
            this.upsertHeaderField('OrderDate');
            this.upsertHeaderField('OrderID');
            break;

        case 'ORDERCONFIRMATION':
            this.upsertHeaderField('ShipToDeliverTO');
            this.upsertHeaderField('OrderDate');
            this.upsertHeaderField('OrderID');
            this.upsertHeaderField('CommentDelivery', { allowUndefined: true });
            this.upsertHeaderField('ConfirmationID');
            this.upsertHeaderField('ConfirmationDate');
            break;

        case 'EUROPE-SHIPPINGNOTIFICATION':
            this.upsertHeaderField('ShipToDeliverTO');
            this.upsertHeaderField('CommentDelivery');
            this.upsertHeaderField('ShipNotificationID');
            this.upsertHeaderField('ShipNotificationDate');
            break;

        case 'ASIA-SHIPPINGNOTIFICATION':
            this.upsertHeaderField('ShipToDeliverTO');
            this.upsertHeaderField('ContactName');
            this.upsertHeaderField('TotalMoney');
            this.upsertHeaderField('CommentPicking', { allowUndefined: true });
            this.upsertHeaderField('CommentDelivery');
            this.upsertHeaderField('Reference');
            this.upsertHeaderField('Location');
            this.upsertHeaderField('CostCentre');
            this.upsertHeaderField('ShipNotificationID');
            this.upsertHeaderField('ShipNotificationDate');
            break;

        case 'DOWNPAYMENT':
            this.upsertHeaderField('ShipToDeliverTO');
            this.upsertHeaderField('ContactName');
            this.upsertHeaderField('TotalMoney');
            this.upsertHeaderField('CommentPicking', { allowUndefined: true });
            this.upsertHeaderField('CommentDelivery');
            this.upsertHeaderField('Reference');
            this.upsertHeaderField('CommentDeparture');
            this.upsertHeaderField('Location');
            this.upsertHeaderField('CostCentre');
            this.upsertHeaderField('ShipNotificationID');
            this.upsertHeaderField('ShipNotificationDate');
            break;

        default:
            throw new Error('Didn\'t find requested order type');
    }
}

/** @private */
Validator.prototype._initializeLineFields = function () {
    switch (this._orderType) {
        case 'ORDER':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemRequestedDeliveryDate', { allowUndefined: true });
            break;

        case 'QUOTATION':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            break;

        case 'ORDERCONFIRMATION':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemMoney', { allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitPrice', { allowUndefined: true });
            this.upsertLineField('ItemDepartureDate');
            this.upsertLineField('ItemDeliveryDate', { allowUndefined: true });
            break;

        case 'EUROPE-SHIPPINGNOTIFICATION':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSoldToPoReference');
            this.upsertLineField('ItemCountryOfOrigin', { allowUndefined: true });
            break;

        case 'ASIA-SHIPPINGNOTIFICATION':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemMoney', { allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSoldToPoReference');
            this.upsertLineField('ItemCountryOfOrigin');
            this.upsertLineField('ItemUnitPrice', { allowUndefined: true });
            break;

        case 'DOWNPAYMENT':
            this.upsertLineField('ItemQuantity');
            this.upsertLineField('ItemCustomMaterial', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemMoney', { allowUndefined: true });
            this.upsertLineField('ItemSupplierPartId', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemUnitOfMeasure', { allowEmpty: true, allowUndefined: true });
            this.upsertLineField('ItemSoldToPoReference');
            this.upsertLineField('ItemCountryOfOrigin');
            this.upsertLineField('ItemUnitPrice', { allowUndefined: true });
            break;

        default:
            throw new Error('Didn\'t find requested order type');
    }
}

/*
------ HELPER FUNCTIONS ------
*/

function deepCopy(
    data
) {
    /*
     Only nested objects can get shallow copied, not primitives themselves
     so if we receive something else than object, we simply return it
     */
    if (!(typeof data === 'object')) {
        return data;
    }

    return JSON.parse(JSON.stringify(data));
}

/** @returns {number} */
function lastRecordIndex() {
    return Validator.recordIndexRange.end();
}

// Tell validator which order type we will be validating (like OC, EU-SN, ASIA-SN, DWNP, PO, QUOTATION)
let mappingValidator = new Validator('');
