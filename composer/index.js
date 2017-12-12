const { getDetailedLocations, getLocations } = require('./libs/resource');
const { getDetailedDepartments, getPortalDepartments } = require('./libs/department');
const { getDetailedEmployees } = require('./libs/employee');
const { createVisit, getVisit, validatePatient, deleteVisit, searchVisit } = require('./libs/patient');
const { getDetailedRooms } = require('./libs/room');
const { syncDepartments } = require('./sync/department');
const { syncRooms } = require('./sync/room');
const { syncEmployees } = require('./sync/employee');
const { getSchedules, deleteSchedules, syncSchedules } = require('./sync/schedule');
const syncMongo = require('./mongo/sync');
module.exports = s => {
    return {
        getDetailedDepartments: () => getDetailedDepartments(s),
        getDetailedEmployees: () => getDetailedEmployees(s),
        getDetailedRooms: () => getDetailedRooms(s),
        getDetailedLocations: (d, m) => getDetailedLocations(s, d, m),
        getPortalDepartments: () => getPortalDepartments(s),
        getLocations: () => getLocations(s),
        getSchedules: (d) => getSchedules(s, d),
        validatePatient: (d) => validatePatient(s, d),
        createVisit: (d) => createVisit(s, d),
        deleteVisit: (d) => deleteVisit(s, d),
        searchVisit: (d) => searchVisit(s, d),
        getVisit: (d) => getVisit(s, d),
        syncDepartments: (d) => syncDepartments(s, d),
        syncRooms: (d) => syncRooms(s, d),
        syncEmployees: (d) => syncEmployees(s, d),
        syncSchedules: (d) => syncSchedules(s, d),
        deleteSchedules: () => deleteSchedules(s),
        syncMongo: () => syncMongo(s)
    };
};
