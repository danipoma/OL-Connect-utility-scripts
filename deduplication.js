/*
This function tries to implicitly assume
which string contains duplicity error and which not
it is safe to say that if you want to deduplicate things
you should keep in as much info as possible like
keeping unit of measure since numbers / amounts can be wrongly
assumed to be duplicate for example customer orders 11 pieces.
*/
function deduplicate(input) {
  // change to string in case we received other type
  input = input.toString();

  let charMap = {};

  // evaluate unique set for each character in input
  for (let prevChar = null, dupCount = 0, i = 0; i < input.length; ++i) {
    let curChar = input[i].toLowerCase();

    if (charMap.hasOwnProperty(curChar)) {
      charMap[curChar].occurrences = charMap[curChar].occurrences + 1;
    } else {
      charMap[curChar] = {
        followingCharCount: 0,
        occurrences: 1,
      };
    }

    if (prevChar == curChar) {
      dupCount++;
    } else if (prevChar != null) {
      // exclude initial value
      if (charMap[prevChar].followingCharCount < dupCount) {
        charMap[prevChar].followingCharCount = dupCount;
      }
      dupCount = 0;
    }

    // to include in last iteration
    if (i == input.length - 1) {
      if (charMap[curChar].followingCharCount < dupCount) {
        charMap[curChar].followingCharCount = dupCount;
      }
    }

    prevChar = curChar;
  }

  let assumedDupCount = null;

  // find min duplicate count across set
  for (element in charMap) {
    let curDupCount = charMap[element].followingCharCount;

    if (assumedDupCount > curDupCount || assumedDupCount == null) {
      assumedDupCount = curDupCount;
    }
  }

  // if some key value had 0 in followingCharCount,
  // we assume that string is not duplicated
  // and so we can early return
  if (assumedDupCount == 0 || assumedDupCount == null) {
    return input;
  }

  // 1 for original character
  let chunkSize = 1 + assumedDupCount;

  // we assume that if there is really a duplicate
  // then string length against chunk modulus should return 0
  if (input.length % chunkSize != 0) {
    return input;
  }

  let output = '';

  // pick up our desired characters
  for (let i = 0; i < input.length; i += chunkSize) {
    let chunk = input.slice(i, i + chunkSize);
    let character = chunk[0];
    // Check that duplicity appears thoughout whole chunk size
    for (let i = 0; i < chunk.length; ++i) {
      if (character != chunk[i]) {
        return input;
      }
    }
    output += character;
  }
  return output;
}
