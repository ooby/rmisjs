function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getDepartment: function (d, cb) {
            c.getDepartment(d, cbp);
        },
        getDepartments: function (d, cb) {
            c.getDepartments(d, cbp);
        }
    };
};