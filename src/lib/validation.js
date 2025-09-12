"use strict";
// client safe validation functions
Object.defineProperty(exports, "__esModule", { value: true });
exports.throwIfMissingFields = throwIfMissingFields;
var errors_1 = require("./errors/errors");
// Throws an error if any of the required fields, specified in the fields object, are missing.
function throwIfMissingFields(fields) {
    var missingFields = Object.entries(fields)
        .filter(function (_a) {
        var value = _a[1];
        return value === undefined || value === null || value === '';
    })
        .map(function (_a) {
        var key = _a[0];
        return key;
    });
    if (missingFields.length > 0) {
        var errorMessage = "Missing required fields: ".concat(missingFields.join(', '));
        var error = new errors_1.ValidationError(errorMessage);
        console.error(error.message);
        throw error;
    }
}
