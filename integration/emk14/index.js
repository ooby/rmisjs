const patient = require('./libs/patient');
const professional = require('./libs/professional');
const document = require('./libs/document');

module.exports = s => {
    return {
        patient: () => patient(s),
        professional: () => professional(s),
        document: () => document(s)
    };
};
