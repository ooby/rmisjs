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
const moment = require('moment');
const TimeSlot = require('../mongo/model/timeslot');
const docs = require('./document');

/**
 * Валидация пациента о наличии и прикреплении в больнице
 * @param {{}} s конфигурация
 * @param {Object} m парамаетры для записи
 * @param {String} m.birthDate дата рождения - '1980-01-31'
 * @param {Object} m.searchDocument параметры документа
 * @param {Number | String} m.searchDocument.docTypeId тип документа - 26 для полиса
 * @param {Number | String} m.searchDocument.docNumber номер документа
 * @param {String} m.GUID UUID талона
 * @return {Promise<{} | null>}
 */
exports.validatePatient = async (s, m) => {
    try {
        let r = await searchIndividual(s, m);
        r = await getPatientRegs(s, r);
        r = await getPatientReg(s, Array.isArray(r) ? r[0] : r);
        return (r) ? r : null;
    } catch (e) {
        console.error(e);
        return e;
    }
};

/**
 * Поиск записи к врачу.
 * Требуется активное подключение к базе данных.
 * @param {{}} s конфигурация
 * @param {Object} m парамаетры для записи
 * @param {String} m.birthDate дата рождения - '1980-01-31'
 * @param {Object} m.searchDocument параметры документа
 * @param {Number | String} m.searchDocument.docTypeId тип документа - 26 для полиса
 * @param {Number | String} m.searchDocument.docNumber номер документа
 * @param {String} m.GUID UUID талона
 * @return {Promise<{} | null>}
 */
exports.searchVisit = async (s, m) => {
    try {
        let timeslot = await TimeSlot.getByUUID(m.GUID).exec();
        if (!timeslot) return '';
        const from = timeslot.from.valueOf();
        const location = timeslot.location.toString();
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
                new Date(slot.date).valueOf() !== from
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
 * Удаление записи к врачу.
 * Требуется активное подключение к базе данных.
 * @param {{}} s конфигурация
 * @param {Object} m парамаетры для записи
 * @param {String} m.birthDate дата рождения - '1980-01-31'
 * @param {Object} m.searchDocument параметры документа
 * @param {Number | String} m.searchDocument.docTypeId тип документа - 26 для полиса
 * @param {Number | String} m.searchDocument.docNumber номер документа
 * @param {String} m.GUID UUID талона
 * @return {Promise<String>}
 */
exports.deleteVisit = async (s, m) => {
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
        await visit.timeslot.updateStatus(slot.status);
        return slip;
    } catch (e) {
        console.error(e);
        return '';
    }
};

/**
 * Создание записи к врачу.
 * Требуется активное подключение к базе данных.
 * @param {{}} s конфигурация
 * @param {Object} m парамаетры для записи
 * @param {String} m.birthDate дата рождения - '1980-01-31'
 * @param {Object} m.searchDocument параметры документа
 * @param {Number | String} m.searchDocument.docTypeId тип документа - 26 для полиса
 * @param {Number | String} m.searchDocument.docNumber номер документа
 * @param {String} m.GUID UUID талона
 * @return {Promise<String>}
 */
exports.createVisit = async (s, m) => {
    try {
        let appointment = await appointmentHelper(s);
        let [timeslot, patient] = await Promise.all([
            TimeSlot.getByUUID(m.GUID).exec(),
            searchIndividual(s, {
                birthDate: m.birthDate,
                searchDocument: {
                    docTypeId: m.searchDocument.docTypeId,
                    docNumber: m.searchDocument.docNumber
                }
            })
        ]);
        let slotId = await postReserve(s, {
            location: timeslot.location,
            dateTime: moment(timeslot.from).format('YYYY-MM-DDTHH:mm:ss.SSSZ'),
            service: timeslot.services[0],
            urgency: false,
            patient
        });
        let slot = await getSlot(s, { slot: slotId });
        await timeslot.updateStatus(slot.status);
        return await appointment.getAppointmentNumber(slotId);
    } catch (e) {
        console.error(e);
        return '';
    }
};

/**
 * Получение номера талона
 * @param {{}} s конфигурация
 * @param {Object} m парамаетры для записи
 * @param {String} m.birthDate дата рождения - '1980-01-31'
 * @param {Object} m.searchDocument параметры документа
 * @param {Number | String} m.searchDocument.docTypeId тип документа - 26 для полиса
 * @param {Number | String} m.searchDocument.docNumber номер документа
 * @param {String} m.GUID UUID талона
 * @return {Promise<String>}
 */
exports.getVisit = async (s, m) => {
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

/**
 * Получение данных пациента для создания/удаления записи.
 * @param {{}} s Конфигурация
 * @param {String} uid UID пациента
 * @return {Promise<{} | null>}
 */
exports.getVisitCredentials = async (s, uid) => {
    try {
        const documents = await docs(s);
        let [docNumber, birthDate] = await Promise.all([
            documents.searchPolis(uid, false),
            documents.getBirthDate(uid)
        ]);
        if (!docNumber || !birthDate) return null;
        if (!docNumber.number || !birthDate.length) return null;
        docNumber = docNumber.number;
        return { docNumber, birthDate };
    } catch (e) {
        console.error(e);
        return null;
    }
};

/**
 * Создание записи к врачу.
 * Требуется активное подключение к базе данных.
 * @param {{}} s Конфигурация
 * @param {String} uid UID пациента
 * @param {String} GUID UUID талона
 * @return {Promise<String>}
 */
exports.createVisitByUID = async (s, uid, GUID) => {
    try {
        let data = await exports.getVisitCredentials(s, uid);
        if (!data) return null;
        let { docNumber, birthDate } = data;
        return await exports.createVisit(s, {
            birthDate,
            searchDocument: {
                docTypeId: '26',
                docNumber
            },
            GUID
        });
    } catch (e) {
        console.error(e);
        return '';
    }
};

/**
 * Удаление записи к врачу.
 * Требуется активное подключение к базе данных.
 * @param {{}} s Конфигурация
 * @param {String} uid UID пациента
 * @param {String} GUID UUID талона
 * @return {Promise<String | null>}
 */
exports.deleteVisitByUID = async (s, uid, GUID) => {
    try {
        let data = await exports.getVisitCredentials(s, uid);
        if (!data) return null;
        let { docNumber, birthDate } = data;
        return await exports.deleteVisit(s, {
            birthDate,
            searchDocument: {
                docTypeId: '26',
                docNumber
            },
            GUID
        });
    } catch (e) {
        console.error(e);
        return '';
    }
};
