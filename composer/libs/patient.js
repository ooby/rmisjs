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
    deleteSlotByRefusal,
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
 * Поиск записи к врачу
 * @param {object} s - конфигурация
 * @param {object} m - парамаетры для записи
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @param {string} m.GUID - UUID талона
 * @return {Promise|object}
 */
exports.searchVisit = async(s, m) => {
    let mongoose;
    try {
        mongoose = await connect(s);
        const TimeSlot = model().TimeSlot;
        let timeslot = await TimeSlot.getByUUID(m.GUID).exec();
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
            slot.id = id;
            return {
                slot,
                timeslot,
                mongoose
            };
        }
        return null;
    } catch (e) {
        if (mongoose) await mongoose.disconnect();
        console.error(e);
        return e;
    }
};

/**
 * Удаление записи к врачу
 * @param {object} s - конфигурация
 * @param {object} m - парамаетры для записи
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @param {string} m.GUID - UUID талона
 * @return {Promise|object}
 */
exports.deleteVisit = async(s, m) => {
    let mongoose;
    try {
        let visit = await exports.searchVisit(s, m);
        if (!visit) return '';
        mongoose = visit.mongoose;
        let slip = await appointmentService(s, {
            id: visit.slot.id
        });
        if (!slip) return '';
        await deleteSlotByRefusal(s, visit.slot.id);
        let slot = await getSlot(s, {
            slot: visit.slot.id
        });
        await visit.timeslot.updateStatus(slot.status).exec();
        return slip.number.number;
    } catch (e) {
        console.error(e);
        return '';
    } finally {
        if (mongoose) await mongoose.disconnect();
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
 * @param {string} m.GUID - UUID талона
 * @return {Promise|object}
 */
exports.createVisit = async(s, m) => {
    let mongoose;
    try {
        mongoose = await connect(s);
        const TimeSlot = model().TimeSlot;
        let [timeslot, patient] = await Promise.all([
            TimeSlot.getByUUID(m.GUID).exec(),
            searchIndividual(s, {
                birthDate: m.birthDate,
                searchDocument: m.searchDocument
            })
        ]);
        let slotId = await postReserve(s, {
            location: timeslot.location,
            dateTime: moment(timeslot.from).format('GGGG-MM-DDTHH:mm:ss.SSSZ'),
            service: timeslot.services[0],
            urgency: false,
            patient: patient
        });
        let slip = appointmentService(s, {
            id: slotId
        });
        let slot = await getSlot(s, {
            slot: slotId
        });
        await timeslot.updateStatus(slot.status).exec();
        return (await slip).number.number;
    } catch (e) {
        console.error(e);
        return '';
    } finally {
        if (mongoose) await mongoose.disconnect();
    }
};

/**
 * Получение номера талона
 * @param {object} s - конфигурация
 * @param {object} m - парамаетры для записи
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @param {string} m.GUID - UUID талона
 * @return {Promise|object}
 */
exports.getVisit = async(s, m) => {
    let mongoose;
    try {
        let visit = await exports.searchVisit(s, m);
        if (!visit) return '';
        mongoose = visit.mongoose;
        let slip = await appointmentService(s, {
            id: visit.slot.id
        });
        if (!slip) return '';
        return slip.number.number;
    } catch (e) {
        console.error(e);
        return '';
    } finally {
        if (mongoose) await mongoose.disconnect();
    }
};
