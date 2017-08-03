const { getDetailedLocations } = require('./libs/resource');
const { getDetailedDepartments, getPortalDepartments } = require('./libs/department');
const { getDetailedEmployees } = require('./libs/employee');
const { getDetailedRooms } = require('./libs/room');
const { syncDepartments } = require('./sync/department');
const { syncRooms } = require('./sync/room');
const { syncEmployees } = require('./sync/employee');
const { syncSchedules } = require('./sync/schedule');
module.exports = s => {
    return {
        getDetailedDepartments: () => getDetailedDepartments(s),
        getDetailedEmployees: () => getDetailedEmployees(s),
        getDetailedRooms: () => getDetailedRooms(s),
        getDetailedLocations: () => getDetailedLocations(s),
        getPortalDepartments: () => getPortalDepartments(s),
        syncDepartments: () => syncDepartments(s),
        syncRooms: () => syncRooms(s),
        syncEmployees: () => syncEmployees(s),
        syncSchedules: () => syncSchedules(s)
    };
};
