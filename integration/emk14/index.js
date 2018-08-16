const patient = require('./libs/patient');
const professional = require('./libs/professional');
const document = require('./libs/document');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = s => {
    return {
        patient: () => patient(s, q),
        professional: () => professional(s, q),
        document: () => document(s, q)
    };
};
