const ss = require('string-similarity');
const {
    createDates,
    isSnils,
    snils,
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

const {
    getDetailedEmployees
} = require('./employee');
const moment = require('moment');
const connect = require('../mongo/connect');
const model = () => require('../mongo/model');

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

/**
 * Формирует из ресурсов коллекцию детализированных данных
 * для отправки в инетграционные сервисы, возвращает Promise
 * @param {object} s - конфигурация
 * @param {object} m - справочник MDP365
 * @return {string|object}
 */
exports.getDetailedLocations = async(s, m) => {
    let mongoose;
    try {
        mongoose = connect(s);
        const Location = model().Location;
        const format = 'HH:mm:ss.SSSZ';
        const dateToTime = date => moment(date).format(format);
        let data = await Location.getDetailedLocationsBySource('MIS', 'PORTAL').exec();
        for (let location of data) {
            for (let key of Object.keys(location)) {
                if (!location[key]) {
                    delete location[key];
                } else if (typeof location[key] !== 'object') {
                    location[key] = location[key].toString();
                }
            }
            for (let date of location.interval) {
                date.timePeriod = date.timePeriod.map(i => {
                    return {
                        from: dateToTime(i.from),
                        to: dateToTime(i.to),
                        uuid: i.uuid,
                        status: i.status
                    };
                });
            }
            let position = m.map(i => i.name.toUpperCase());
            position = ss.findBestMatch(location.positionName.toUpperCase(), position);
            position = m.map(i => i.name.toUpperCase()).indexOf(position.bestMatch.target);
            position = m[position].code;
            Object.assign(location, {
                position
            });
        }
        return data;
    } catch (e) {
        return e;
    } finally {
        if (mongoose) mongoose.disconnect();
    }
};