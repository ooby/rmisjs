module.exports = s => {
    return {
        patient: () => require('./libs/patient')(s),
        professional: () => require('./libs/professional')(s),
        document: () => require('./libs/document')(s)
    };
};
