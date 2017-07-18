const { getLocationsWithPortal } = require('./resource');
const { getDetailedDepartments } = require('./department');
const { getDetailedEmployees } = require('./employee');
module.exports = s => {
    return {
        getLocationsWithPortal: () => getLocationsWithPortal(s),
        getDetailedDepartments: () => getDetailedDepartments(s),
        getDetailedEmployees: () => getDetailedEmployees(s)
    };
};