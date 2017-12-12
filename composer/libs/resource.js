const ss = require('string-similarity');
const {
    dateFormat,
    createDates,
    isSnils,
    snils,
    getService,
    getDepartment,
    getDocument,
    getEmployee,
    getEmployees,
    getEmployeePosition,
    getEmployeeSpecialities,
    getIndividual,
    getIndividualDocuments,
    getLocation,
    getLocations,
    getRefbook,
    getRefbookList,
    getRoom,
    getTimes,
    getVersionList
} = require('./collect');

const getDetailedEmployees = require('./employee').getDetailedEmployees;
const moment = require('moment');
const uuid = require('uuid/v4');
const connect = require('../mongo/connect');
const TimeSlot = require('../mongo/model/timeslot');

/**
 * Запрашивает и возвращает код справочника
 * @param {object} s - конфигурация
 * @param {string} ref - наименование справочника
 * @return {string|object}
 */
const getRefCode = async(s, ref) => {
    try {
        let k = await getRefbookList(s);
        let specRefCode;
        k.refbook.forEach(i => {
            let code;
            i.column.forEach(j => {
                if (j.name === 'CODE') {
                    code = j.data;
                }
                if (j.name === 'NAME' && j.data === ref) {
                    specRefCode = code;
                }
            });
        });
        return specRefCode;
    } catch (e) {
        console.error(e);
        return e;
    }
};

/**
 * Запрашивает и возвращает версию справочника
 * @param {object} s - конфигурация
 * @param {string} code - OID код справочника
 * @return {string|object}
 */
const getRefVersion = async(s, code) => {
    try {
        let specRefVersion;
        let k = await getVersionList(s, code);
        k[0].column.forEach(i => {
            if (i.name === 'VERSION') {
                specRefVersion = i.data;
            }
        });
        return specRefVersion;
    } catch (e) {
        console.error(e);
        return e;
    }
};

const timeFormat = date => moment(date).format('HH:mm:ss.SSSZ');

/**
 * Формирует из ресурсов коллекцию детализированных данных
 * для отправки в инетграционные сервисы, возвращает Promise
 * @param {object} s - конфигурация
 * @param {object} m - справочник MDP365
 * @param {object} c - справочник C33001
 * @return {string|object}
 */
exports.getDetailedLocations = async(s, m, c) => {
    try {
        let data = await connect(s, () =>
            TimeSlot.getDetailedLocationsBySource('MIS')
        );
        for (let location of data) {
            for (let interval of location.interval) {
                interval.date = dateFormat(interval.date);
                for (let period of interval.timePeriod) {
                    period.from = timeFormat(period.from);
                    period.to = timeFormat(period.to);
                }
            }
            let positionNames = m.map(i => i.name.toUpperCase());
            let position = ss.findBestMatch(location.positionName.toUpperCase(), positionNames);
            position = positionNames.indexOf(position.bestMatch.target);
            location.position = parseInt(m[position].code);
            let specialityNames = c.map(i => i.name.toUpperCase());
            let speciality = ss.findBestMatch(location.specialityName.toUpperCase(), specialityNames);
            speciality = specialityNames.indexOf(speciality.bestMatch.target);
            location.speciality = parseInt(c[speciality].code);
        }
        return data;
    } catch (e) {
        console.error(e);
        return e;
    }
};
