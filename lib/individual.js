function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getDocument: function (d, cb) {
            c.getDocument(d, cbp);
        },
        getIndividual: function (d, cb) {
            c.getIndividual(d, cbp);
        },
        getIndividualDocuments: function (d, cbp) {
            c.getIndividualDocuments(d, cbp);
        }
    };
};