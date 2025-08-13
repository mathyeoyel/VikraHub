/**
 * String utility functions for safe string operations
 */

/**
 * Safely split a string, returning an empty array if the value is not a string
 * @param {unknown} value - The value to split
 * @param {string} separator - The separator to split by
 * @returns {string[]} Array of split strings or empty array
 */
export const safeSplit = (value, separator = ',') => {
  return typeof value === 'string' && value ? value.split(separator) : [];
};

/**
 * Safely convert a value to string with fallback
 * @param {unknown} value - The value to convert
 * @param {string} fallback - Fallback value if conversion fails
 * @returns {string} String representation or fallback
 */
export const asString = (value, fallback = '') => {
  return value == null ? fallback : String(value);
};

/**
 * Safely get string property from object with fallback
 * @param {object} obj - The object to get property from
 * @param {string} key - The property key
 * @param {string} fallback - Fallback value
 * @returns {string} Property value or fallback
 */
export const safeString = (obj, key, fallback = '') => {
  return obj && obj[key] != null ? String(obj[key]) : fallback;
};

/**
 * Safely trim and filter empty strings from an array
 * @param {string[]} array - Array of strings to clean
 * @returns {string[]} Cleaned array
 */
export const cleanStringArray = (array) => {
  if (!Array.isArray(array)) return [];
  return array.map(item => asString(item).trim()).filter(Boolean);
};
