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

// Constructor
function Excel(baseName) {
    if (typeof (baseName) !== 'string' && baseName != null) {
        throw new TypeError('Expected string, got ' + typeof (baseName));
    }

    // Private constants
    this._MAX_COLUMN_SPAN = 1000;
    this._START_COLUMN_STEP = 100;

    this._MAX_ROW_SPAN = 60000;
    this._START_ROW_STEP = 10000;

    this._DEFAULT_BASENAME = 'COLUMN';

    this._SEARCH_DEPTH = 100;


    // Apply user-specific settings
    baseName = baseName == null ? this._DEFAULT_BASENAME : baseName

   // Constructor

    /*
    We are working on under restriction that column name is set in a way
    that can be constructed using baseName and columnIndex.
    Like this: COLUMN1, COLUMN2, COLUMN-N...
    */

    /*
    In case baseName wouldn't be COLUMN, I gave user opt-in to give custom baseName
    */
    this._baseName = baseName;

    this._startRowIndex = 1;

    /*
    I expect column iterator to use numbers, that's why I am not allowing
    user input on this, furthermore I would have to see the case, so I
    could restrict and iterate properly.

    Not to mention that at this point we have no API to check first and last index,
    so user could use it in incorrect way - like specify column index that is already out
    of bounds
    */
    this._startColumnIndex = 1;

    // Call initialization methods
    this._getRowSpan();
    this._getColumnSpan();
}

// PUBLIC
/*
How to call this function:
mappingHelper.getLastColumnName();

Function retrieves last column name
*/
Excel.prototype.getLastColumnName = function () {
    return this.getColumnName(this._lastColumnIndex);
}

// PUBLIC
/*
How to call this function:
mappingHelper.getFirstColumnName();

Function retrieves first column name
*/
Excel.prototype.getFirstColumnName = function () {
    return this.getColumnName(this._startColumnIndex);
}

// PUBLIC
/*
How to call this function:
mappingHelper.findCell(/abc/i, 0, 3);

If you don't specify indexes like this:
mappingHelper.findCell(/abc/i);

You may also specify string data type like this:
mappingHelper.findCell('abc', 1, 50);

Function will assume to search 100 rows
off your current position downwards
if you don't specify anything.
*/
Excel.prototype.findCell = function (search, startRowOffset, stopRowOffset) {
    if ((search instanceof RegExp === true || typeof (search) === 'string') === false || search == null) {
        throw new TypeError('Expected Object(RegExp) | string, got ' + typeof (search));
    }

    if (typeof (startRowOffset) !== 'number' && startRowOffset != null) {
        throw new TypeError('Expected number, got ' + typeof (startRowOffset));
    }

    if (typeof (stopRowOffset) !== 'number' && stopRowOffset != null) {
        throw new TypeError('Expected number, got ' + typeof (stopRowOffset));
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

// PRIVATE
/*
How to call this function:
mappingHelper.columnExists('COLUMN1');

returns Boolean (true/false)
*/
/* Just a wrapper around PPress Excel API */
Excel.prototype._columnExists = function (columnName) {
    if (typeof (columnName) !== 'string' || columnName == null) {
        throw new TypeError('Expected string, got ' + typeof (columnName));
    }
    return data.fieldExists(columnName);
}

// PRIVATE
/*
How to call this function:
mappingHelper.rowExists(13);

returns Boolean (true/false)
*/
Excel.prototype._rowExists = function (rowOffset) {
    if (typeof (rowOffset) !== 'number' || rowOffset == null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
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

// PRIVATE
/*
How to call this function:
mappingHelper.getCellValueByOffset('COLUMN1', 0);

Wrapper around data.extract which works with offset (relative position to current position)
*/
Excel.prototype._getCellValueByOffset = function (columnName, rowOffset) {
    if (typeof (columnName) !== 'string' || columnName == null) {
        throw new TypeError('Expected string, got ' + typeof (columnName));
    }

    if (typeof (rowOffset) !== 'number' && rowOffset != null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
    }

    return data.extract(columnName, rowOffset)
}

// PRIVATE
/*
    Converts Offset value to Index
*/
Excel.prototype._rowOffsetToIndex = function (rowOffset) {
    if (typeof (rowOffset) !== 'number' && rowOffset != null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
    }

    return this._getCurrentRowOffset() + rowOffset
}

// PRIVATE
/*
    Converts Index value to Offset
*/
Excel.prototype._rowIndexToOffset = function (rowIndex) {
    if (typeof (rowIndex) !== 'number' && rowIndex != null) {
        throw new TypeError('Expected number, got ' + typeof (rowIndex));
    }

    let currentOffset = this._getCurrentRowOffset();

    if (currentOffset > rowIndex) {
        return currentOffset - rowIndex;
    }

    return rowIndex - currentOffset;
}

// PRIVATE
/*
How to call this function:
mappingHelper.getCurrentRowOffset();
*/
Excel.prototype._getCurrentRowOffset = function () {
    return steps.currentPosition;
}

// PRIVATE
Excel.prototype.getColumnName = function(columnIndex) {
    if (typeof (columnIndex) !== 'number' || columnIndex == null) {
        throw new TypeError('Expected number, got ' + typeof (columnIndex));
    }

    return this._baseName + columnIndex;
}
// PRIVATE
/*
Retrieves indexes of column data and saves them into object instance
*/
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

        if (this._columnExists(columnName) === false) {
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

// PRIVATE
/*
Retrieves indexes of row data and saves them into object instance
*/
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

        if (this._rowExists(rowOffset) === false) {
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



// PRIVATE
/*
Function reduces number by order of magnitude
i.e: giving 1000 -> 100 -> 10 -> 1

If after reduction result happens to be less or equal to 1,
function returns 1
*/
Excel.prototype._reduceMagnitude = function (num) {
    if (typeof (num) !== 'number' || num == null) {
        throw new TypeError('Expected number, got ' + typeof (num));
    }

    num = parseInt(num / 10, 10);
    return num = num < 1 ? 1 : num;
}

// PRIVATE
/*
Helper function for restricting row offset within bounds
*/
Excel.prototype._restrictRowOffset = function (rowOffset) {
    if (typeof (rowOffset) !== 'number' || rowOffset == null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
    }

    // Make sure that index is whole number
    rowOffset = parseInt(rowOffset, 10);

    let startRowOffset = this._rowIndexToOffset(this._startRowIndex);
    let lastRowOffset = this._rowIndexToOffset(this._lastRowIndex);

    // Restrict lower bound
    rowOffset = rowOffset < startRowOffset ? startRowOffset : rowOffset;

    // REstrict upper bound
    rowOffset = rowOffset > lastRowOffset ? lastRowOffset : rowOffset;

    return rowOffset;
}

// PRIVATE
/*
Helper function for checking whether row is within bounds
*/
Excel.prototype._isRowOffsetWithinBounds = function (rowOffset) {
    if (typeof (rowOffset) !== 'number' || rowOffset == null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
    }

    let res = this._restrictRowOffset(rowOffset);
    return res === rowOffset;
}

// PRIVATE
/*
Search for specific content in singular row
*/
Excel.prototype._findCellAtRowOffset = function (search, rowOffset) {
    if ((search instanceof RegExp === true || typeof (search) === 'string') === false || search == null) {
        throw new TypeError('Expected Object(RegExp) | string, got ' + typeof (search));
    }

    if (typeof (rowOffset) !== 'number' || rowOffset == null) {
        throw new TypeError('Expected number, got ' + typeof (rowOffset));
    }

    // Check row boundary
    if (this._isRowOffsetWithinBounds(rowOffset) === false) {
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

        return {
            term: term,
            matched: matched[0],
            columnName: columnName,
            columnIndex: curColumnIndex,
            rowOffset: rowOffset,
            rowIndex: rowIndex
        }
    }

    throw new Error('Search term was not found on row offset ' + rowOffset + ', row index ' + rowIndex);
}

let mappingHelper = new Excel();
