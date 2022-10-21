/*
This helper was written using Object prototype, because classes,
default values in function signature, const etc. are not supported
in software we use.

NOTE:
Excel mapper works with offset (0-based, relative),
however first accessible line index is returning 1
(meaning index is 1-based, absolute).

Index is most likely 0-based, however due to inaccessibility
to header column by standard means, it will be viewed as 1-based.
*/

/** 
 * @typedef {Object} Excel
 * @constructor
 */
function Excel(
    /** @type {string} */
    baseName
) {
    if (!(typeof baseName === 'string' || baseName == null)) {
        throw new TypeError('Expected string | null, got ' + typeof baseName);
    }


    /** 
     * @private
     * @type {number}
    */
    this._MAX_COLUMN_SPAN = 1000;
    /** 
     * @private
     * @type {number}
    */
    this._START_COLUMN_STEP = 100;

    /** 
     * @private
     * @type {number}
    */
    this._MAX_ROW_SPAN = 60000;
    /** 
     * @private
     * @type {number}
    */
    this._START_ROW_STEP = 10000;

    /** 
     * @private
     * @type {string}
    */
    this._DEFAULT_BASENAME = 'COLUMN';

    /** 
     * @private
     * @type {number}
    */
    this._SEARCH_DEPTH = 100;


    // Apply user-specific settings
    baseName = baseName == null ? this._DEFAULT_BASENAME : baseName

    /*
    We are working on under restriction that column name is set in a way
    that can be constructed using baseName and columnIndex.
    Like this: COLUMN1, COLUMN2, COLUMN-N...
    */

    /*
    In case baseName wouldn't be COLUMN, I gave user opt-in to give custom baseName
    */
    /** 
     * @private
     * @type {string}
    */
    this._baseName = baseName;

    /** 
     * @private
     * @type {number}
    */
    this._startRowIndex = 1;

    /*
    I expect column iterator to use numbers, that's why I am not allowing
    user input on this, furthermore I would have to see the case, so I
    could restrict and iterate properly.

    Not to mention that at this point we have no API to check first and last index,
    so user could use it in incorrect way - like specify column index that is already out
    of bounds
    */
    /** 
     * @private
     * @type {number}
    */
    this._startColumnIndex = 1;

    // Call initialization methods
    this._getRowSpan();
    this._getColumnSpan();
}

/** @public */
Excel.prototype.getLastColumnName = function () {
    return this.getColumnName(this._lastColumnIndex);
}

/** @public */
Excel.prototype.getFirstColumnName = function () {
    return this.getColumnName(this._startColumnIndex);
}

/** @public */
Excel.prototype.findCell = function (
    /** @type {string | RegExp} */
    search,
    /** @type {?number} */
    startRowOffset,
    /** @type {?number} */
    stopRowOffset
) {
    if (!(search instanceof RegExp || typeof search === 'string')) {
        throw new TypeError('Expected Object(RegExp) | string, got ' + typeof search);
    }

    if (!(typeof startRowOffset === 'number' || startRowOffset == null)) {
        throw new TypeError('Expected number | null, got ' + typeof startRowOffset);
    }

    if (!(typeof stopRowOffset === 'number' || stopRowOffset == null)) {
        throw new TypeError('Expected number | null, got ' + typeof stopRowOffset);
    }

    // Set default offset
    if (startRowOffset == null) {
        startRowOffset = 0;
    }

    // Set default offset
    if (stopRowOffset == null) {
        stopRowOffset = startRowOffset + this._SEARCH_DEPTH;
    }

    // Restrict to file index bounds
    startRowOffset = this._restrictRowOffset(startRowOffset);
    stopRowOffset = this._restrictRowOffset(stopRowOffset);

    for (let curRowOffset = startRowOffset; curRowOffset <= stopRowOffset; ++curRowOffset) {
        try {
            return this._findCellAtRowOffset(search, curRowOffset);
        } catch (e) {
            continue;
        }
    }

    throw new Error('Search term was not found');
}

/** @public */
Excel.prototype.getColumnName = function (
    /** @type {number} */
    columnIndex
) {
    if (!(typeof columnIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof columnIndex);
    }

    return this._baseName + columnIndex;
}

/** @private */
Excel.prototype._columnExists = function (
    /** @type {string} */
    columnName
) {
    if (!(typeof columnName === 'string')) {
        throw new TypeError('Expected string, got ' + typeof columnName);
    }

    /** @type {boolean} */
    let result = data.fieldExists(columnName);
    return result;
}

/** @private */
Excel.prototype._rowExists = function (
    /** @type {number} */
    rowOffset
) {
    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    let columnName = this.getColumnName(this._startColumnIndex)

    try {
        /*
        PPress doesn't have API for field existance, so we
        just check if this API triggers exception and if not,
        we assume that field exists
        */
        this._getCellValueByOffset(columnName, rowOffset);
        return true;
    } catch (e) {
        return false;
    }
}

/** @private */
Excel.prototype._getCellValueByOffset = function (
    /** @type {string} */
    columnName,
    /** @type {number} */
    rowOffset) {
    if (!(typeof columnName === 'string')) {
        throw new TypeError('Expected string, got ' + typeof columnName);
    }

    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    /** @type {string} */
    let result = data.extract(columnName, rowOffset);
    return result;
}

/** @private */
Excel.prototype._rowOffsetToIndex = function (
    /** @type {number} */
    rowOffset
) {
    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    return this._getCurrentRowOffset() + rowOffset
}

/** @private */
Excel.prototype._rowIndexToOffset = function (
    /** @type {number} */
    rowIndex
) {
    if (!(typeof rowIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowIndex);
    }

    let currentOffset = this._getCurrentRowOffset();

    if (currentOffset > rowIndex) {
        return currentOffset - rowIndex;
    }

    return rowIndex - currentOffset;
}

/** @private */
Excel.prototype._getCurrentRowOffset = function () {
    /** @type {number} */
    let result = steps.currentPosition
    return result;
}

/** @private */
Excel.prototype._getColumnSpan = function () {
    /*
    step range to decrease iteration count
    idea is to have higher step number and if column is suddenly not found
    then are going to go a step back
    */
    let step = this._START_COLUMN_STEP;
    /*
    Planetpress column starts with 1 - COLUMN1 for example
    */
    for (let columnIndex = this._startColumnIndex + step; ; columnIndex += step) {
        let columnName = this.getColumnName(columnIndex);

        if (!this._columnExists(columnName)) {
            if (step === 1) {
                this._lastColumnIndex = columnIndex - step;
                break;
            }

            columnIndex -= step;
            step = this._reduceMagnitude(step);
            continue;
        }

        /*
        Safety net for incorrect baseName or non-standard column name data
        */
        if (columnIndex >= this._MAX_COLUMN_SPAN) {
            throw new RangeError('Range exceeded ' + columnIndex + ' iterations');
        }
    }
}

/** @private */
Excel.prototype._getRowSpan = function () {
    /*
    step range to decrease iteration count
    idea is to have higher step number and if column is suddenly not found
    then are going to go a step back
    */
    let step = this._START_ROW_STEP;
    /*
    PPress row starts with 1
    */
    for (let rowOffset = this._rowIndexToOffset(this._startRowIndex + step); ; rowOffset += step) {

        if (!this._rowExists(rowOffset)) {
            if (step === 1) {
                this._lastRowIndex = this._rowOffsetToIndex(rowOffset - step);
                break;
            }

            rowOffset -= step;
            step = this._reduceMagnitude(step);
            continue;
        }

        /*
        Safety net as I have yet to see this PO excel in my lifetime
        */
        if (rowOffset >= this._MAX_ROW_SPAN) {
            throw new RangeError('Range exceeded ' + rowOffset + ' iterations');
        }
    }
}



/** @private */
Excel.prototype._reduceMagnitude = function (
    /** @type {number} */
    num
) {
    if (!(typeof num === 'number')) {
        throw new TypeError('Expected number, got ' + typeof num);
    }

    num = parseInt(num / 10, 10);
    return num = num < 1 ? 1 : num;
}


/** @private */
Excel.prototype._restrictRowOffset = function (
    /** @type {number} */
    rowOffset
) {
    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    // Make sure that index is whole number
    rowOffset = parseInt(rowOffset, 10);

    let startRowOffset = this._rowIndexToOffset(this._startRowIndex);
    let lastRowOffset = this._rowIndexToOffset(this._lastRowIndex);

    // Restrict lower bound
    rowOffset = rowOffset < startRowOffset ? startRowOffset : rowOffset;

    // Restrict upper bound
    rowOffset = rowOffset > lastRowOffset ? lastRowOffset : rowOffset;

    return rowOffset;
}

/** @private */
Excel.prototype._isRowOffsetWithinBounds = function (
    /** @type {number} */
    rowOffset
) {
    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    let res = this._restrictRowOffset(rowOffset);

    return res === rowOffset;
}


/** @private */
Excel.prototype._findCellAtRowOffset = function (
    /** @type {string | RegExp} */
    search,
    /** @type {number} */
    rowOffset
) {
    if (!(search instanceof RegExp || typeof search === 'string')) {
        throw new TypeError('Expected Object(RegExp) | string, got ' + typeof search);
    }

    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    // Check row boundary
    if (!this._isRowOffsetWithinBounds(rowOffset)) {
        throw Error('Row offset is out of bounds');
    }

    let rowIndex = this._rowOffsetToIndex(rowOffset);

    for (let curColumnIndex = this._startColumnIndex; curColumnIndex <= this._lastColumnIndex; ++curColumnIndex) {
        let columnName = this.getColumnName(curColumnIndex);
        let term = this._getCellValueByOffset(columnName, rowOffset);
        let matched = term.match(search);

        if (matched == null) {
            continue;
        }

        return new Cell(term, columnName, curColumnIndex, rowOffset, rowIndex);
    }

    throw new Error('Search term was not found on row offset ' + rowOffset + ', row index ' + rowIndex);
}

/** 
 * @typedef {Object} Cell
 * @constructor
 */
function Cell(
    /** @type {string} */
    content,
    /** @type {string} */
    columnName,
    /** @type {number} */
    columnIndex,
    /** @type {number} */
    rowOffset,
    /** @type {number} */
    rowIndex
) {
    if (!(typeof content === 'string')) {
        throw new TypeError('Expected string, got ' + typeof content);
    }

    if (!(typeof columnName === 'string')) {
        throw new TypeError('Expected string, got ' + typeof columnName);
    }

    if (!(typeof columnIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof columnIndex);
    }

    if (!(typeof rowOffset === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowOffset);
    }

    if (!(typeof rowIndex === 'number')) {
        throw new TypeError('Expected number, got ' + typeof rowIndex);
    }

    this.content = content;
    this.columnName = columnName;
    this.columnIndex = columnIndex;
    this.rowOffset = rowOffset;
    this.rowIndex = rowIndex;
}

let mappingHelper = new Excel();