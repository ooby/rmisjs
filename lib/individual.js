module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getDocument: function (d, cb) {
            c.getDocument(d, function (e, r) { cb(e, r); });
        },
        getIndividual: function (d, cb) {
            c.getIndividual(d, function (e, r) { cb(e, r); });
        },
        getIndividualDocuments: function (d, cb) {
            c.getIndividualDocuments(d, function (e, r) { cb(e, r); });
        }
    };
};