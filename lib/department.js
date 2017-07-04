module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getDepartment: function (d, cb) {
            c.getDepartment(d, function (e, r) { cb(e, r); });
        },
        getDepartments: function (d, cb) {
            c.getDepartments(d, function (e, r) { cb(e, r); });
        }
    };
};