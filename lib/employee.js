function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getEmployee: function (d, cb) {
            c.getEmployee(d, cbp);
        },
        getEmployees: function (d, cb) {
            c.getEmployees(d, cbp);
        },
        getEmployeePosition: function (d, cb) {
            c.getEmployeePosition(d, cbp);
        },
        getEmployeePositions: function (d, cb) {
            c.getEmployeePositions(d, cbp);
        },
        getEmployeeSpecialities: function (d, cb) {
            c.getEmployeeSpecialities(d, cbp);
        },
        getPosition: function (d, cb) {
            c.getPosition(d, cbp);
        }
    };
};