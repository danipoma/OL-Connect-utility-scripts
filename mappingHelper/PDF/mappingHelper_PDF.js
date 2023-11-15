/**
 * This object type should not be directly called.
 *
 * You should use PDF._getCurrentPage() on instantiated PDF object.
 * There currently isn't any checking implemented since we only have
 * this method, which calls to function which should pass us valid
 * boundaries.
 *
 * @typedef {Object} Page
 * @constructor
 */
function Page(
    /** @type {number} */
    pageNumber,
    /** @type {number} */
    pageHeight,
    /** @type {number} */
    pageWidth) {
    if (!(typeof pageNumber === 'number')) {
        throw new TypeError('Expected Page(pageNumber: number), got Page(pageNumber: ' + typeof pageNumber + ')');
    }

    if (!(typeof pageHeight === 'number')) {
        throw new TypeError('Expected Page(pageHeight: number), got Page(pageHeight: ' + typeof pageHeight + ')');
    }

    if (!(typeof pageWidth === 'number')) {
        throw new TypeError('Expected Page(pageWidth: number), got Page(pageWidth: ' + typeof pageWidth + ')');
    }

    /** @type {number} */
    this.pageNumber = pageNumber;
    /** @type {number} */
    this.pageHeight = pageHeight;
    /** @type {number} */
    this.pageWidth = pageWidth;
}

/**
 * This object type should not be directly called.
 *
 * You should use PDF.getRecordCoordinates() method on instantiated object
 * as it does needed checks that are available in PDF instance.
 *
 * Holds coordinates in current file that can be used to calculate
 * RecordIndex, which is used to pass into exposed 3rd party API
 * to get us to position we requested.
 *
 * @typedef {Object} RecordCoordinates
 * @constructor
 */
function RecordCoordinates(
    /** @type {number} */
    pageNumber,
    /** @type {number} */
    height) {
    if (!(typeof pageNumber === 'number')) {
        throw new TypeError('Expected RecordCoordinates(pageNumber: number), got RecordCoordinates(pageNumber: ' + typeof pageNumber + ')');
    }

    if (!(typeof height === 'number')) {
        throw new TypeError('Expected RecordCoordinates(height: number), got RecordCoordinates(height: ' + typeof height + ')');
    }

    /** @type {number} */
    this.pageNumber = pageNumber;
    /** @type {number} */
    this.height = height;
}

/**
 * This object type should not be directly called.
 *
 * You should use PDF._getRecordIndex() on instantiated object
 * as it works with RecordCoordinates, which is checked if called
 * through PDF.getRecordCoordinates()
 *
 * @typedef {Object} RecordIndex
 * @constructor
 */
function RecordIndex(
    /** @type {number} */
    recordIndex) {
    if (!(typeof recordIndex === 'number')) {
        throw new TypeError('Expected RecordIndex(recordIndex: Object(RecordCoordinates), got RecordIndex(recordIndex: ' + typeof coordinates + ')');
    }

    /** @type {number} */
    this.value = recordIndex;
}

/**
 * @typedef {Object} PDF
 * @constructor
 */
function PDF() {
    /**
     * @private
     * @type {number}
    */
    this._MIN_HEIGHT = 0;
    /**
     * @private
     * @type {number}
    */
    this._FIRST_PAGE = 1;
    /** @type {number} */
    this.TOTAL_PAGES = this._getTotalPages();

    /**
     * @private
     * @type {number}
    */
    this._UNIT_PAGE_NUMBER = 1

    /**
     * @private
     * @type {number}
    */
    this._UNIT_RECORD_INDEX = 0;

    /*
    We can't use method getCurrentPosition() since at this point in
    time we don't have all needed info to use it (Call to _PAGES).
    */
    let currentPage = this.getCurrentPageNumber();
    let currentHeight = this.getCurrentHeight();

    this._PAGES = this._getPages();
    this._RECORD_LENGTH = this._PAGES.reduce((sum, item) => sum += item.pageHeight, 0);

    this.moveTo(currentPage, currentHeight);
}

/** @public */
PDF.prototype.getCurrentPosition = function () {
    let currentPageNumber = this.getCurrentPageNumber();
    let currentHeight = this.getCurrentHeight();

    return this.getRecordCoordinates(currentPageNumber, currentHeight);
}

/**
 * Function retrieves information about every page.
 * Pages in PDF can be be in various sizes, so we have to keep record for every page.
 * @private */
PDF.prototype._getPages = function () {
    let pages = [];

    for (let page = this._FIRST_PAGE; page <= this.TOTAL_PAGES; ++page) {
        this._moveToPage(page);
        pages.push(this._getCurrentPage());
    }

    return pages;
}

/**
 * @public
 * @overloading
*/
PDF.prototype.moveTo = function (
    /** @type {RecordIndex | RecordCoordinates | number} */
    page,
    /** @type {?number} */
    height) {
    if (page instanceof RecordIndex) {
        page = this._restrictToRecordBounds(page);
        this._moveToByRecordIndex(page);
        return;
    }
    if (page instanceof RecordCoordinates) {
        let recordIdx = this._getRecordIndex(page);
        this._moveToByRecordIndex(recordIdx);
        return;
    }

    if (typeof page === 'number' && typeof height === 'number') {
        let coordinates = this.getRecordCoordinates(page, height);
        let recordIdx = this._getRecordIndex(coordinates);
        this._moveToByRecordIndex(recordIdx);
        return;
    }

    throw new TypeError('Signature PDF.prototype.moveTo(page: ' + typeof page + ', height: ' + typeof height + ') was not found in overloaded options');
}

/**
 * @public
*/
PDF.prototype.moveBy = function (
    /** @type {number} */
    offset) {
    if (!(typeof offset === 'number')) {
        throw new TypeError('Expected PDF.prototype.moveBy(offset: number, got PDF.prototype.moveBy(offset: ' + typeof offset + ')');
    }

    let currentPosition = this.getCurrentPosition();
    let coordinates = this._getRecordIndex(currentPosition);
    coordinates.value += offset;
    coordinates = this._restrictToRecordBounds(coordinates);
    this.moveTo(coordinates);
}

/**
 * @public
 * @constructs RecordCoordinates
 */
PDF.prototype.getRecordCoordinates = function (
    /** @type {number} */
    page,
    /** @type {number} */
    height) {
    if (!(typeof page === 'number')) {
        throw new TypeError('Expected PDF.prototype.getRecordCoordinates(page: number), got PDF.prototype.getRecordCoordinates(page: ' + typeof page + ')');
    }

    if (!(typeof height === 'number')) {
        throw new TypeError('Expected PDF.prototype.getRecordCoordinates(height: number), got PDF.prototype.getRecordCoordinates(height: ' + typeof height + ')');
    }

    return this._restrictToRecordBounds(page, height);
}

/** @public */
PDF.prototype.getCurrentHeight = function () {
    /** @type {number} */
    let result = steps.currentPosition;
    return result;
}

/** @public */
PDF.prototype.getCurrentPageNumber = function () {
    /** @type {number} */
    let result = steps.currentPage;
    return result;
}

/**
 * @private
 * @constructs Page
 */
PDF.prototype._getCurrentPage = function () {
    let pageNumber = this.getCurrentPageNumber();
    let pageHeight = this._getCurrentPageHeight();
    let pageWidth = this._getCurrentPageWidth();

    return new Page(pageNumber, pageHeight, pageWidth);
}

/** @private */
PDF.prototype._getTotalPages = function () {
    /** @type {number} */
    let result = steps.totalPages;
    return result;
}

/** @private */
PDF.prototype._restrictToPageNumberBounds = function (
    /** @type {number} */
    page) {

    if (!(typeof page === 'number')) {
        throw new TypeError('Expected PDF.prototype._restrictToPageNumberBounds(page: number), got PDF.prototype._restrictToPageNumberBounds(page: ' + typeof page + ')');
    }

    // Bound checking
    page = page > this.TOTAL_PAGES ? this.TOTAL_PAGES : page;
    page = page < this._FIRST_PAGE ? this._FIRST_PAGE : page;

    return page;
}

/** @private */
PDF.prototype._restrictToPageHeightBounds = function (
    /** @type {number} */
    page,
    /** @type {number} */
    height) {
    if (!(typeof page === 'number')) {
        throw new TypeError('Expected PDF.prototype._restrictToPageHeightBounds(page: number), got PDF.prototype._restrictToPageHeightBounds(page: ' + typeof page + ')');
    }

    if (!(typeof height === 'number')) {
        throw new TypeError('Expected PDF.prototype._restrictToPageHeightBounds(height: number), got PDF.prototype._restrictToPageHeightBounds(height: ' + typeof height + ')');
    }

    // Bound check page number
    page = this._restrictToPageNumberBounds(page);

    // Bound check height of page
    let referencedPage = this._PAGES.filter(item => item.pageNumber === page)[0];
    let referencedPageHeight = referencedPage.pageHeight;

    height = height > referencedPageHeight ? referencedPageHeight : height;
    height = height < this._MIN_HEIGHT ? this._MIN_HEIGHT : height;

    return height;
}

/**
 * @private
 * @overloading
*/
PDF.prototype._restrictToRecordBounds = function (
    /** @type {RecordIndex | RecordCoordinates | number} */
    page,
    /** @type {?number} */
    height) {
    if (page instanceof RecordIndex) {
        page.value = page.value > this._RECORD_LENGTH ? this._RECORD_LENGTH : page.value;
        return page;
    }

    if (page instanceof RecordCoordinates) {
        height = page.height;
        page = page.pageNumber;
    }

    if (typeof page === 'number' && typeof height === 'number') {
        // Bound check page number
        page = this._restrictToPageNumberBounds(page);

        // Bound check height of page
        height = this._restrictToPageHeightBounds(page, height);

        return new RecordCoordinates(page, height);
    }

    throw new TypeError('Signature PDF.prototype._restrictToRecordBounds(page: ' + typeof page + ', height: ' + typeof height + ') was not found in overloaded options');
}

/** @private */
PDF.prototype._moveToByRecordIndex = function (
    /** @type {RecordIndex} */
    recordIndex) {
    if (!(recordIndex instanceof RecordIndex)) {
        throw new TypeError('Expected PDF.prototype._moveToByRecordIndex(recordIndex: Object(RecordIndex), got PDF.prototype._moveToByRecordIndex(recordIndex: ' + typeof recordIndex + ')');
    }

    steps.moveTo(this._UNIT_RECORD_INDEX, recordIndex.value);
}

/** @private */
PDF.prototype._getCurrentPageHeight = function () {
    /** @type {number} */
    let result = steps.currentPageHeight;
    return result;
}

/** @private */
PDF.prototype._getCurrentPageWidth = function () {
    /** @type {number} */
    let result = steps.currentPageWidth;
    return result;
}

/**
 * @private
 * @overloading
*/
PDF.prototype._moveToPage = function (
    /** @type {RecordCoordinates | number} */
    page) {
    if (page instanceof RecordCoordinates) {
        page = page.pageNumber;
    }

    if (typeof page === 'number') {
        /*
        I wanted to use getRecordCoordinates() that already has bound checking,
        but that method depends on page overview being evaluated, however this method
        is being used in that method that evaluates page overview, so we have to use
        this approach.
        */
        page = this._restrictToPageNumberBounds(page);
        steps.moveTo(this._UNIT_PAGE_NUMBER, page);
        return;
    }

    throw new TypeError('Signature PDF.prototype._moveToPage(page: ' + typeof page + ') was not found in overloaded options');
}

/**
 * @private
 * @constructs RecordIndex
 */
PDF.prototype._getRecordIndex = function (
    /** @type {RecordCoordinates} */
    coordinates) {
    if (!(coordinates instanceof RecordCoordinates)) {
        throw new TypeError('Expected PDF.prototype._getRecordIndex(coordinates: Object(RecordCoordinates), got PDF.prototype._getRecordIndex(coordinates: ' + typeof coordinates + ')');
    }

    coordinates = this._restrictToRecordBounds(coordinates);

    let recordIdx = this._PAGES.reduce((sum, item) => item.pageNumber < coordinates.pageNumber ? sum += item.pageHeight : sum, 0) + coordinates.height;

    return new RecordIndex(recordIdx);
}

/**
 * @static
 * @overloading
 */
PDF.findTextPosition = function (
    /** @type {RegExp | string} */
    search,
    /** @type {number | null | undefined} */
    height,
    /** @type {number | null | undefined} */
    maxOffset) {
    if (!(search instanceof RegExp || typeof search === 'string')) {
        throw new TypeError('Expected PDF.findTextPosition(search: Object(RegExp) | string), got PDF.findTextPosition(search: ' + typeof search + ')');
    }

    if (height === null || height === undefined) {
        height = 4;
    }

    if (!(typeof height === 'number')) {
        throw new TypeError('Expected PDF.findTextPosition(height: number), got PDF.findTextPosition(height: ' + typeof height + ')');
    }

    if (maxOffset === null || maxOffset === undefined) {
        maxOffset = 100;
    }

    if (!(typeof maxOffset === 'number')) {
        throw new TypeError('Expected PDF.findTextPosition(maxOffset: number), got PDF.findTextPosition(maxOffset: ' + typeof maxOffset + ')');
    }

    let leftPosition = 0;
    let rightPosition = Math.floor(steps.currentPageWidth);
    // Normally pages are around 300, so we jump marginally to decrease loop count
    let INITIAL_STEP_BY = 100;
    let offset = 0;

    for (; offset <= maxOffset; offset++) {
        let wholeContent = data.extract(leftPosition, rightPosition, offset, height, "<br />");


        if (wholeContent.match(search) === null) {
            continue;
        }

        for (let stepBy = INITIAL_STEP_BY; true;) {
            rightPosition -= stepBy;
            let lookupContent = data.extract(leftPosition, rightPosition, offset, height, "<br />");

            if (lookupContent.match(search) === null && stepBy <= 1) {
                rightPosition += stepBy;
                break;
            }

            if (lookupContent.match(search) === null) {
                rightPosition += stepBy;
                stepBy /= 10;
                continue;
            }

            if (lookupContent.match(search) !== null) {
                continue;
            }
        }

        for (let stepBy = INITIAL_STEP_BY; true;) {
            leftPosition += stepBy;
            let lookupContent = data.extract(leftPosition, rightPosition, offset, height, "<br />");

            if (lookupContent.match(search) === null && stepBy <= 1) {
                leftPosition -= stepBy;
                break;
            }

            if (lookupContent.match(search) === null) {
                leftPosition -= stepBy;
                stepBy /= 10;
                continue;
            }

            if (lookupContent.match(search) !== null) {
                continue;
            }
        }

        return { left: leftPosition, right: rightPosition, offset: offset };
    }

    return null;
}


let mappingHelper = new PDF();
