const httpError = require('http-errors');
const mongoose = require('mongoose');

/**
 * Http error
 * 
 * @function error
 * @param {number} code error code
 * @param {string} message error message
 * @return {object} http error
 */
exports.error = (code, message) => httpError(code, message);

/**
 * Mongoose error to http error conversion
 * @function mhError
 * @param {object} err error object
 * @return {object} http error
 */
exports.mhError = err =>
    (err instanceof mongoose.Error) ?
        httpError(500, err.name + ' > ' + err.message) :
        httpError(err.code, err.message);
