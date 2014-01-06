/**
 * Utilities on prototypes. Keep it small!
 * @author Kam

/**
 * Retrieves length of associative arrays
 * @return size of the object
 * http://stackoverflow.com/questions/5223/length-of-javascript-object-ie-associative-array
 */
Object.size = function(obj) {
  var size = 0;
  for (var key in obj) {
      if (obj.hasOwnProperty(key)) size++;
  }
  return size;
};

/**
 * Filter elements by value, checking 'key' of the array element, like:
 *
 * <code>var arr = [{'age': 12, 'name': 'Cage'}, {'age': 11, 'name': 'Clark'}]<br>
 * arr.filterValue('age', 11);
 * </code>
 *
 * @param key key of the target
 * @param value expected value in a single element or as an array
 * @param notEqual [optional] set true, if you want to check for non equality. Non equality can be used only when
 * value is not an array!
 */
Array.prototype.filterValue = function(key, value, notEqual) {
  return this.filter(function(item) {
    var result = false;
    if (angular.isArray(value)) {
      value.forEach(function(valueItem) {
        if (item[key] === valueItem)
          result = true;
      });
    } else
      result = checkValue(item[key], value);

    function checkValue(a, b) {
      if (typeof notEqual === 'undefined')
        return a === b;
      else
        return a !== b;
    }

    return result;
  });
};

Number.prototype.toFixedNumber = function(arguments) {
  return Number(this.toFixed(arguments));
};