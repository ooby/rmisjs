const {
    createDates,
    createPatient,
    dateFormat,
    getLocation,
    getLocations,
    getLocationsWithOptions,
    getPatient,
    getPatientReg,
    getPatientRegs,
    getReserve,
    getSlot,
    getTimes,
    isoTimeFormat,
    postReserve,
    searchIndividual,
    timeFormat
} = require('./collect');
const appointmentService = require('./appointmentHelper');
const model = () => require('../mongo/model');
const connect = require('../mongo/connect');
const moment = require('moment');

/**
 * Валидация пациента о наличии и прикреплении в больнице
 * @param {object} s - конфигурация
 * @param {object} m - параметры поиска
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @return {Promise|object}
 */
exports.validatePatient = async (s, m) => {
    try {
        let r = await searchIndividual(s, m);
        if (r) {
            r = await getPatientRegs(s, r);
            if (Array.isArray(r)) {
                r = await getPatientReg(s, r[0]);
            } else {
                r = await getPatientReg(s, r);
            }
        }
        return (r) ? r : null;
    } catch (e) { return e; }
};

/**
 * Создание записи к врачу
 * @param {object} s - конфигурация
 * @param {object} m - парамаетры для записи
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @return {Promise|object}
 */
exports.createVisit = async (s, m) => {
    try {
        const mongoose = connect(s);
        const { TimeSlot } = model();
        let slot = await TimeSlot.findOne({
            'uuid': m.GUID,
            'unabailable': { $ne: 'PORTAL' },
            'services.0': { $exists: true }
        }).exec();
        if (!slot) return Promise.reject('The slot doesn\'t exist.');
        let patient = await searchIndividual(s, {
            birthDate: m.birthDate,
            searchDocument: m.searchDocument
        });
        let reserve = {
            location: slot.location,
            dateTime: moment(slot.from).format('GGGG-MM-DDTHH:mm:ss.SSSZ'),
            service: slot.services[0],
            urgency: false,
            patient
        };
        let slip = await postReserve(s, reserve);
        let { number } = await appointmentService(s, { id: slip });
        return number.number;
    } catch (e) { return e; }
};
exports.getVisit = async (s, m) => {
    try {
        let pi = { birthDate: m.birthDate, searchDocument: m.searchDocument };
        let r = await searchIndividual(s, pi);
        r = await getReserve(s, { patient: r });
        let result = [];
        for (let i of r) {
            let dd = await getSlot(s, { slot: i });
            if (parseInt(dd.status) !== 4 && parseInt(dd.status) !== 6) {
                result.push(i);
            }
        }
        // TODO: Исправить на правильный
        return (result[0]) ? result[0] : '';
    } catch (e) { return e; }
};
