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

const getDetailedEmployees = require('./employee').getDetailedEmployees;
const moment = require('moment');
const connect = require('../mongo/connect');
const uuid = require('uuid/v4');
const Location = require('../mongo/model/location');

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
        mongoose = await connect(s);
        const dateToTime = date => moment(date).format('HH:mm:ss.SSSZ');
        let data = await Location.getDetailedLocationsBySource('MIS', 'PORTAL').exec();
        for (let location of data) {
            for (let key of Object.keys(location)) {
                if (key === 'interval') {
                    for (let interval of location.interval) {
                        interval.date = moment(interval.date).format('GGGG-MM-DD');
                        interval.timePeriod = interval.timePeriod.map(i => {
                            return {
                                from: dateToTime(i.from),
                                to: dateToTime(i.to),
                                uuid: uuid({ random: i._id.buffer }),
                                status: i.status
                            };
                        });
                    }
                } else if (!location[key]) {
                    delete location[key];
                } else if (typeof location[key] !== 'object') {
                    location[key] = location[key].toString();
                }
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
        if (mongoose) await mongoose.disconnect();
    }
};
