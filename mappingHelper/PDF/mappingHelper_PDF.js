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
		throw new TypeError('Expected number, got ' + typeof pageNumber);
	}

	if (!(typeof pageHeight === 'number')) {
		throw new TypeError('Expected number, got ' + typeof pageHeight);
	}

	if (!(typeof pageWidth === 'number')) {
		throw new TypeError('Expected number, got ' + typeof pageWidth);
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
		throw new TypeError('Expected number, got ' + typeof pageNumber);
	}

	if (!(typeof height === 'number')) {
		throw new TypeError('Expected number, got ' + typeof height);
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
		throw new TypeError('Expected Object(RecordCoordinates), got ' + typeof coordinates);
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
	/** @type {RecordCoordinates | number} */
	page,
	/** @type {?number} */
	height) {

	let signatureFound = false;
	/** @type {RecordCoordinates} */
	let coordinates;

	if (page instanceof RecordCoordinates) {
		signatureFound = true;
		coordinates = page;
	}

	if (typeof page === 'number' && typeof height === 'number') {
		signatureFound = true;
		coordinates = this.getRecordCoordinates(page, height);

	}

	if (!signatureFound) {
		throw new TypeError('Signature (' + typeof page + ', ' + typeof height + ') was not found in overloaded options');
	}

	let recordIdx = this._getRecordIndex(coordinates);
	this._moveToByRecordIndex(recordIdx);
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
		throw new TypeError('Expected number, got ' + typeof page);
	}

	if (!(typeof height === 'number')) {
		throw new TypeError('Expected number, got ' + typeof height);
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
		throw new TypeError('Expected number, got ' + typeof page);
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
		throw new TypeError('Expected number, got ' + typeof page);
	}

	if (!(typeof height === 'number')) {
		throw new TypeError('Expected number, got ' + typeof height);
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

/** @private */
PDF.prototype._restrictToRecordBounds = function (
	/** @type {number} */
	page,
	/** @type {number} */
	height) {
	if (!(typeof page === 'number')) {
		throw new TypeError('Expected number, got ' + typeof page);
	}

	if (!(typeof height === 'number')) {
		throw new TypeError('Expected number, got ' + typeof height);
	}

	// Bound check page number
	page = this._restrictToPageNumberBounds(page);

	// Bound check height of page
	height = this._restrictToPageHeightBounds(page, height);

	return new RecordCoordinates(page, height);
}

/** @private */
PDF.prototype._moveToByRecordIndex = function (
	/** @type {RecordIndex} */
	recordIndex) {
	if (!(recordIndex instanceof RecordIndex)) {
		throw new TypeError('Expected Object(RecordIndex), got ' + typeof recordIndex);
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
	let signatureFound = false;
	/** @type {number} */
	let pageNumber;

	if (page instanceof RecordCoordinates) {
		signatureFound = true;
		pageNumber = page.pageNumber;
	}

	if (typeof page === 'number') {
		signatureFound = true;
		/*
		I wanted to use getRecordCoordinates() that already has bound checking,
		but that method depends on page overview being evaluated, however this method
		is being used in that method that evaluates page overview, so we have to use
		this approach.
		*/
		pageNumber = this._restrictToPageNumberBounds(page);
	}

	if (!signatureFound) {
		throw new TypeError('Signature ' + typeof page + ' was not found in overloaded options');
	}

	steps.moveTo(this._UNIT_PAGE_NUMBER, pageNumber);
}

/**
 * @private
 * @constructs RecordIndex
 */
PDF.prototype._getRecordIndex = function (
	/** @type {RecordCoordinates} */
	coordinates) {
	if (!(coordinates instanceof RecordCoordinates)) {
		throw new TypeError('Expected Object(RecordCoordinates), got ' + typeof coordinates);
	}

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
	height) {
	if (!(search instanceof RegExp || typeof search === 'string')) {
		throw new TypeError('Expected Object(RegExp) | string, got ' + typeof search);
	}

	if (height === null || height === undefined) {
		height = 4;
	}

	if (!(typeof height === 'number')) {
		throw new TypeError('Expected number, got ' + typeof height);
	}


	let leftPosition = 0;
	let rightPosition = Math.floor(steps.currentPageWidth);
	// Normally pages are around 300, so we jump marginally to decrease loop count
	let INITIAL_STEP_BY = 100;
	let offset = 0;

	// limit to offset 100 should be enough since user should be near text they want to find
	for (; offset <= 100; offset++) {
		let wholeContent = data.extract(leftPosition, rightPosition, offset, height, "<br />");


		if (wholeContent.match(search) === null) {
			continue;
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

		return { left: leftPosition, right: rightPosition };
	}

	throw new Error("Text position was not found");
}


let mappingHelper = new PDF();
