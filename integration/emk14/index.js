const patient = require('./libs/patient');
const professional = require('./libs/professional');
const document = require('./libs/document');
const Queue = require('../../libs/queue');
const _ = require('lodash');

let q = null;

module.exports = s => {
    if (!q) q = new Queue(_.get(s, 'emk14.limit', 50));
    return {
        patient: () => patient(s, q),
        professional: () => professional(s, q),
        document: () => document(s, q)
    };
};
