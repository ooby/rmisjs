const ss = require('string-similarity');
const {
    dateFormat,
    getRefbookList,
    getVersionList
} = require('./collect');

const moment = require('moment');
const TimeSlot = require('../mongo/model/timeslot');

/**
 * Запрашивает и возвращает код справочника
 * @param {object} s - конфигурация
 * @param {string} ref - наименование справочника
 * @return {string|object}
 */
const getRefCode = async (s, ref) => {
    try {
        let k = await getRefbookList(s);
        let specRefCode;
        for (let i of k.refbook) {
            let code;
            for (let j of i.column) {
                if (j.name === 'CODE') code = j.data;
                if (j.name === 'NAME' && j.data === ref) specRefCode = code;
            }
        }
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
const getRefVersion = async (s, code) => {
    try {
        let specRefVersion;
        let k = await getVersionList(s, code);
        for (let i of k[0].column) {
            if (i.name === 'VERSION') specRefVersion = i.data;
        }
        return specRefVersion;
    } catch (e) {
        console.error(e);
        return e;
    }
};

const timeFormat = date => moment(date).format('HH:mm:ss.SSSZ');

/**
 * Возвращает код по имени записи в справочнике
 * @param {Object} dict - справочник
 * @param {String} name - имя записи
 * @return {Number} - код записи
 */
const getCodeByName = (dict, name) => {
    let names = dict.map(i => i.name.toUpperCase());
    let value = ss.findBestMatch(name.toUpperCase(), names);
    value = names.indexOf(value.bestMatch.target);
    return parseInt(dict[value].code);
};

/**
 * Формирует из ресурсов коллекцию детализированных данных
 * для отправки в инетграционные сервисы, возвращает Promise.
 * Требуется активное подключение к базе данных.
 * @param {object} s - конфигурация
 * @param {object} m - справочник MDP365
 * @param {object} c - справочник C33001
 * @return {string|object}
 */
exports.getDetailedLocations = async (s, m, c) => {
    try {
        let data = await TimeSlot.getDetailedLocationsBySource('MIS');
        for (let location of data) {
            for (let interval of location.interval) {
                interval.date = dateFormat(interval.date);
                for (let period of interval.timePeriod) {
                    period.from = timeFormat(period.from);
                    period.to = timeFormat(period.to);
                }
            }
            location.position = getCodeByName(m, location.positionName);
            location.speciality = getCodeByName(c, location.specialityName);
        }
        return data;
    } catch (e) {
        console.error(e);
        return e;
    }
};
