const { getLocationsWithPortal } = require('./libs/resource');
const { getDetailedDepartments } = require('./libs/department');
const { getDetailedEmployees } = require('./libs/employee');
const { getDetailedRooms } = require('./libs/room');
module.exports = s => {
    return {
        getDetailedDepartments: () => getDetailedDepartments(s),
        getDetailedEmployees: () => getDetailedEmployees(s),
        getDetailedRooms: () => getDetailedRooms(s),
        getLocationsWithPortal: () => getLocationsWithPortal(s)
    };
};