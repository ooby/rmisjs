module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getEmployee: function (d, cb) {
            c.getEmployee(d, function (e, r) { cb(e, r); });
        },
        getEmployees: function (d, cb) {
            c.getEmployees(d, function (e, r) { cb(e, r); });
        },
        getEmployeePosition: function (d, cb) {
            c.getEmployeePosition(d, function (e, r) { cb(e, r); });
        },
        getEmployeePositions: function (d, cb) {
            c.getEmployeePositions(d, function (e, r) { cb(e, r); });
        },
        getEmployeeSpecialities: function (d, cb) {
            c.getEmployeeSpecialities(d, function (e, r) { cb(e, r); });
        },
        getPosition: function (d, cb) {
            c.getPosition(d, function (e, r) { cb(e, r); });
        }
    };
};