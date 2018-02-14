const getDetailedRooms = require('./libs/room').getDetailedRooms;
const getDetailedEmployees = require('./libs/employee').getDetailedEmployees;
const syncRooms = require('./sync/room').syncRooms;
const syncEmployees = require('./sync/employee').syncEmployees;
const syncDepartments = require('./sync/department').syncDepartments;
const mongoRooms = require('./mongo/sync/rooms');
const mongoServices = require('./mongo/sync/services');
const mongoLocations = require('./mongo/sync/locations');
const mongoEmployees = require('./mongo/sync/employees');
const mongoTimeSlots = require('./mongo/sync/timeslots');
const mongoDepartments = require('./mongo/sync/departments');
const getProtocol = require('./libs/protocol');
const emk = require('./emk');
const {
    getSchedules,
    syncSchedules,
    deleteSchedules,
    deleteSchedulesForDates
} = require('./sync/schedule');
const {
    getVisit,
    createVisit,
    deleteVisit,
    searchVisit,
    validatePatient
} = require('./libs/patient');
const {
    getLocations,
    getDetailedLocations
} = require('./libs/resource');
const {
    getPortalDepartments,
    getDetailedDepartments
} = require('./libs/department');
const snilsOms = require('./sync/snilsOms');
const cased = require('./emk/cases');
const card = require('./card');

module.exports = s => {
    return {
        getDetailedDepartments: () => getDetailedDepartments(s),
        getDetailedEmployees: () => getDetailedEmployees(s),
        getDetailedRooms: () => getDetailedRooms(s),
        getDetailedLocations: (d, m) => getDetailedLocations(s, d, m),
        getPortalDepartments: () => getPortalDepartments(s),
        getLocations: () => getLocations(s),
        getSchedules: d => getSchedules(s, d),
        validatePatient: d => validatePatient(s, d),
        createVisit: d => createVisit(s, d),
        deleteVisit: d => deleteVisit(s, d),
        searchVisit: d => searchVisit(s, d),
        getVisit: d => getVisit(s, d),
        syncDepartments: d => syncDepartments(s, d),
        syncRooms: d => syncRooms(s, d),
        syncEmployees: d => syncEmployees(s, d),
        syncSchedules: d => syncSchedules(s, d),
        deleteSchedules: (d, m) => deleteSchedules(s, d, m),
        deleteSchedulesForDates: (...d) => deleteSchedulesForDates(s, ...d),
        mongoDepartments: () => mongoDepartments(s),
        mongoLocations: () => mongoLocations(s),
        mongoRooms: () => mongoRooms(s),
        mongoEmployees: () => mongoEmployees(s),
        mongoTimeSlots: () => mongoTimeSlots(s),
        mongoServices: () => mongoServices(s),
        syncEmk: () => emk(s).then(p => p.syncAll()),
        getCase: d => cased(s).then(p => p.getCase(d)),
        getProtocol: d => getProtocol(s, d),
        snilsOms: () => snilsOms(s),
        card: () => card(s)
    };
};
