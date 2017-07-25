const moment = require('moment');
exports.getDepartment = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.department();
        r = await r.getDepartment({ departmentId: id });
        r = (r) ? r.department : null;
        return r;
    } catch (e) { return e; };
};
exports.getDepartments = async (s) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.department();
        r = await r.getDepartments({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; };
};
exports.getLocation = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.resource();
        r = await r.getLocation({ location: id });
        r = (r) ? r.location : null;
        return r;
    } catch (e) { return e; };
};
exports.getLocations = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.resource();
        r = await r.getLocations({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
exports.getTimes = async (s, id, date) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.appointment();
        r = await r.getTimes({ location: id, date: date });
        r = (r) ? r.interval : null;
        return r;
    } catch (e) { return e; }
};
exports.getRoom = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.room();
        r = await r.getRoom({ roomId: id });
        r = (r) ? r.room : null;
        return r;
    } catch (e) { return e; };
};
exports.getRooms = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.room();
        r = await r.getRooms({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
exports.getEmployee = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.employee();
        r = await r.getEmployee({ id: id });
        r = (r) ? r.employee : null;
        return r;
    } catch (e) { return e; };
};
exports.getEmployees = async s => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.employee();
        r = await r.getEmployees({ organization: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
exports.getEmployeePositions = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.employee();
        r = await r.getEmployeePositions({ employee: id });
        return r;
    } catch (e) { return e; };
};
exports.getEmployeePosition = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.employee();
        r = await r.getEmployeePosition({ id: id });
        r = (r) ? r.employeePosition : null;
        return r;
    } catch (e) { return e; };
};
exports.getEmployeeSpecialities = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.employee();
        r = await r.getEmployeeSpecialities({ employee: id });
        return r;
    } catch (e) { return e; };
};
exports.getIndividual = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.individual();
        r = await r.getIndividual(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};
exports.getIndividualDocuments = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.individual();
        r = await r.getIndividualDocuments(id);
        r = (r) ? r.document : null;
        return r;
    } catch (e) { return e; };
};
exports.getDocument = async (s, id) => {
    try {
        const rmisjs = require('../../index')(s);
        const rmis = rmisjs.rmis;
        let r = await rmis.individual();
        r = await r.getDocument(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};
exports.createDates = () => {
    let dates = [];
    for (let i = 0; i < 14; i++) {
        let d = moment().add(i, 'd');
        if (d.isoWeekday() !== 6 && d.isoWeekday() !== 7) {
            dates.push(d.format('YYYY-MM-DD'));
        }
    }
    return dates;
};
exports.isSnils = s => (s.replace(/-/g, '').replace(/ /g, '').length === 11) ? true : false;
exports.snils = s => s.replace(/-/g, '').replace(/ /g, '');