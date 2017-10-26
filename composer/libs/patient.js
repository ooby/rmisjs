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
    getSlot,
    getTimes,
    isoTimeFormat,
    postReserve,
    searchIndividual,
    timeFormat
} = require('./collect');
// const appointmentService = require('./appointmentHelper');

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
 * @param {object} m - парамеотры для записи
 * @param {string} m.birthDate - дата рождения - '1980-01-31'
 * @param {object} m.searchDocument - параметры документа
 * @param {number} m.searchDocument.docTypeId - тип документа - 26 для полиса
 * @param {number} m.searchDocument.docNumber - номер документа
 * @return {Promise|object}
 */
exports.createVisit = async (s, m) => {
    try {
        let pi = { birthDate: m.birthDate, searchDocument: m.searchDocument };
        let r = await searchIndividual(s, pi);
        let individual = r;
        let result = [];
        let schedule;
        let slot;
        if (r) {
            const rmisjs = require('../../index')(s);
            const er14 = await rmisjs.integration.er14.process();
            const { getSchedFormat, schedFormat, slotFormat } = require('../sync/format');
            let dates = createDates();
            for (let d of dates) {
                let data = getSchedFormat({
                    scheduleDate: d,
                    muCode: s.er14.muCode,
                    needFIO: false
                });
                let dd = await er14.getScheduleInfo(data);
                result.push(dd);
            }
            result = result.filter(i => !!i.scheduleInfo);
            result.forEach(i => {
                for (let j of i.scheduleInfo.schedule) {
                    if (Array.isArray(j.slot)) {
                        for (let k of j.slot) {
                            if (k.slotInfo.GUID === m.GUID) {
                                schedule = j;
                                slot = k;
                            }
                        }
                    } else {
                        if (j.slot.slotInfo.GUID === m.GUID) {
                            schedule = j;
                            slot = j.slot;
                        }
                    }
                }
            });
        }
        r = await getLocations(s);
        result = [];
        for (let i of r.location) {
            let dd = await getTimes(s, i, schedule.scheduleDate);
            Object.assign(dd, { location: i, individual: individual });
            result.push(dd);
        }
        result = result.filter(i => !!i.timePeriod);
        result = result.filter(i => {
            i.timePeriod = i.timePeriod.filter(j => {
                if (j.notAvailableSources &&
                    j.notAvailableSources.notAvailableSource.some(k => k.source === 'PORTAL')) {
                    return false;
                } else { return true; }
            });
            i.timePeriod = i.timePeriod.filter(j => {
                let tpFrom = j.from.replace(/\.000\+09:00/g, '');
                let tpTo = j.to.replace(/\.000\+09:00/g, '');
                let tsFrom = slot.timeInterval.timeStart.replace(/Z/g, '');
                let tsTo = slot.timeInterval.timeFinish.replace(/Z/g, '');
                return (tpFrom === tsFrom && tpTo === tsTo) ? true : false;
            });
            i = (i.timePeriod.length > 0) ? i : null;
            return i;
        });
        result = result.filter(i => !!i);
        let reserve = {
            location: result[0].location,
            dateTime: schedule.scheduleDate + 'T' + slot.timeInterval.timeStart.replace(/Z/g, ''),
            service: result[0].timePeriod[0].availableServices.service[0],
            urgency: false,
            patient: result[0].individual
        };
        let slip = await postReserve(s, reserve);
        // let appNumber = await appointmentService(s, { id: slip });
        return slip;
    } catch (e) { return e; }
};
