const { getDetailedLocations, getLocations } = require('./libs/resource');
const { getDetailedDepartments, getPortalDepartments } = require('./libs/department');
const { getDetailedEmployees } = require('./libs/employee');
const { createVisit, validatePatient } = require('./libs/patient');
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
        getDetailedLocations: (d) => getDetailedLocations(s, d),
        getPortalDepartments: () => getPortalDepartments(s),
        getLocations: () => getLocations(s),
        validatePatient: (d) => validatePatient(s, d),
        createVisit: (d) => createVisit(s, d),
        syncDepartments: (d) => syncDepartments(s, d),
        syncRooms: (d) => syncRooms(s, d),
        syncEmployees: (d) => syncEmployees(s, d),
        syncSchedules: (d) => syncSchedules(s, d)
    };
};
