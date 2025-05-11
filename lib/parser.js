import { Prisma } from "@prisma/client"; // Or from your prisma client export path

/**
 * Parses a value to an integer.
 * Returns null if the value is null, undefined, an empty string, or NaN.
 * @param {*} value - The value to parse.
 * @returns {number|null} The parsed integer or null.
 */
export const parseIntOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const num = parseInt(value, 10);
    return isNaN(num) ? null : num;
};

/**
 * Parses a value to a float.
 * Returns null if the value is null, undefined, an empty string, or NaN.
 * @param {*} value - The value to parse.
 * @returns {number|null} The parsed float or null.
 */
export const parseFloatOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    const num = parseFloat(value);
    return isNaN(num) ? null : num;
};

/**
 * Parses a value to a boolean.
 * Handles string "true"/"false" (case-insensitive), actual booleans.
 * Returns the defaultValue if the value is null, undefined, or an empty string,
 * or if the string is not a recognizable boolean.
 * If defaultValue is undefined, it returns null for unparseable strings,
 * or the original value if it was null/undefined (maintaining its original nullishness).
 *
 * @param {*} value - The value to parse.
 * @param {boolean} [defaultValue=undefined] - The default value to return if parsing fails or input is nullish.
 * @returns {boolean|null|undefined} The parsed boolean, defaultValue, or null/undefined.
 */
export const parseBoolean = (value, defaultValue = undefined) => {
    if (value === null || value === undefined || value === '') {
        // If defaultValue is explicitly provided, use it for nullish inputs.
        // Otherwise, return the original nullish value.
        return defaultValue !== undefined ? defaultValue : value;
    }
    if (typeof value === 'boolean') {
        return value;
    }
    if (typeof value === 'string') {
        const lowerValue = value.toLowerCase();
        if (lowerValue === 'true') {
            return true;
        }
        if (lowerValue === 'false') {
            return false;
        }
    }
    // If not a boolean and not a "true"/"false" string, return defaultValue.
    // If defaultValue is undefined, this means it couldn't be parsed and no fallback was given for this case.
    return defaultValue;
};


/**
 * Parses a value to a Date object.
 * Returns null if the value is null, undefined, an empty string, or an invalid date string.
 * @param {*} value - The value to parse (string, number, or Date).
 * @returns {Date|null} The parsed Date object or null.
 */
export const parseDateOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    // If it's already a Date object and valid, return it
    if (value instanceof Date && !isNaN(value.getTime())) {
        return value;
    }
    // Attempt to parse other types
    const date = new Date(value);
    return isNaN(date.getTime()) ? null : date;
};

/**
 * Parses a value to a Prisma.Decimal.
 * Returns null if the value is null, undefined, an empty string, or cannot be converted.
 * @param {*} value - The value to parse.
 * @returns {Prisma.Decimal|null} The parsed Prisma.Decimal or null.
 */
export const parseDecimalOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    try {
        // Prisma.Decimal constructor can take string, number, or another Decimal
        return new Prisma.Decimal(value.toString()); // Convert to string first for broader compatibility
    } catch (e) {
        // console.error("Failed to parse Decimal:", value, e); // Optional logging
        return null;
    }
};

/**
 * Parses a value that is expected to be an array of integers.
 * Returns null if the input is not an array or if any element is not a valid integer.
 * Empty array input results in an empty array output.
 * @param {*} value - The value to parse.
 * @returns {number[]|null} An array of integers or null.
 */
export const parseIntArrayOrNull = (value) => {
    if (value === null || value === undefined) {
        return null;
    }
    if (!Array.isArray(value)) {
        return null;
    }
    if (value.length === 0) {
        return [];
    }

    const result = [];
    for (const item of value) {
        const num = parseIntOrNull(item);
        if (num === null) {
            return null; // If any item is not a valid int, invalidate the whole array
        }
        result.push(num);
    }
    return result;
};

/**
 * Parses a JSON string into an object or array.
 * Returns null if the value is null, undefined, an empty string, or invalid JSON.
 * If already an object/array, returns it directly.
 * @param {string|object|Array} value - The value to parse.
 * @returns {object|Array|null} The parsed JSON object/array or null.
 */
export const parseJsonOrNull = (value) => {
    if (value === null || value === undefined || value === '') {
        return null;
    }
    if (typeof value === 'object') { // Already an object or array
        return value;
    }
    if (typeof value === 'string') {
        try {
            return JSON.parse(value);
        } catch (e) {
            return null;
        }
    }
    return null; // Not a string or object
};