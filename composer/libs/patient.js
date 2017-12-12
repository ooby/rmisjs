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
const appointmentHelper = require('./appointmentHelper');
const connect = require('../mongo/connect');
const moment = require('moment');
const TimeSlot = require('../mongo/model/timeslot');

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
        console.error(e);
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
    try {
        let timeslot = await connect(s, () =>
            TimeSlot.getByUUID(m.GUID).exec()
        );
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
                timeslot
            };
        }
        return null;
    } catch (e) {
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
    try {
        let [appointmentService, visit] = await Promise.all([
            appointmentHelper(s),
            exports.searchVisit(s, m)
        ]);
        let slip = await appointmentService.getAppointmentNumber(visit.slot.id);
        await deleteSlotByRefusal(s, visit.slot.id);
        let slot = await getSlot(s, {
            slot: visit.slot.id
        });
        await connect(s, () =>
            visit.timeslot.updateStatus(slot.status).exec()
        );
        return slip;
    } catch (e) {
        console.error(e);
        return '';
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
    try {
        let [appointmentService, timeslot, patient] = await Promise.all([
            appointmentHelper(s),
            connect(s, () => TimeSlot.getByUUID(m.GUID).exec()),
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
            patient
        });
        let slip = await appointmentService.getAppointmentNumber(slotId);
        let slot = await getSlot(s, {
            slot: slotId
        });
        await connect(s, () =>
            timeslot.updateStatus(slot.status).exec()
        );
        return slip;
    } catch (e) {
        console.error(e);
        return '';
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
    try {
        let [appointmentService, visit] = await Promise.all([
            appointmentHelper(s),
            exports.searchVisit(s, m)
        ]);
        return await appointmentService.getAppointmentNumber(visit.slot.id);
    } catch (e) {
        console.error(e);
        return '';
    }
};
