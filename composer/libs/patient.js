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
exports.validatePatient = async(s, m) => {
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
    } catch (e) {
        return e;
    }
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
exports.createVisit = async(s, m) => {
    let mongoose;
    try {
        mongoose = await connect(s);
        const TimeSlot = model().TimeSlot;
        let slot = await TimeSlot.findOne({
            '_id': m.GUID,
            'unabailable': {
                $ne: 'PORTAL'
            },
            'services.0': {
                $exists: true
            }
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
        let slipId = await postReserve(s, reserve);
        let slip = await appointmentService(s, {
            id: slipId
        });
        return slipId.number.number;
    } catch (e) {
        return e;
    } finally {
        if (mongoose) await mongoose.disconnect();
    }
};
exports.getVisit = async(s, m) => {
    let mongoose;
    try {
        mongoose = await connect(s);
        const TimeSlot = model().TimeSlot;
        let timeslot = await TimeSlot.getByUUID(m.GUID).lean().exec();
        if (!timeslot) return '';
        const from = timeslot.from.valueOf();
        const location = timeslot.location.toString();
        const status = timeslot.status.toString();
        let patient = await searchIndividual(s, {
            birthDate: m.birthDate,
            searchDocument: m.searchDocument
        });
        let slots = await getReserve(s, {
            patient
        });
        for (let id of slots.reverse()) {
            let slot = await getSlot(s, {
                slot: id
            });
            if (slot.locationId !== location ||
                new Date(slot.date).valueOf() !== from ||
                slot.status !== status
            ) continue;
            let slip = await appointmentService(s, {
                id
            });
            return slip.number.number;
        }
        return '';
    } catch (e) {
        return e;
    } finally {
        if (mongoose) await mongoose.disconnect();
    }
};
