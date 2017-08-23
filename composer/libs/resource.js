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

const { getDetailedEmployees } = require('./employee');

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
        k.refbook.forEach(i => {
            let code;
            i.column.forEach(j => {
                if (j.name === 'CODE') { code = j.data; }
                if (j.name === 'NAME' && j.data === ref) {
                    specRefCode = code;
                }
            });
        });
        return specRefCode;
    } catch (e) { console.error(e); return e; }
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
        k[0].column.forEach(i => {
            if (i.name === 'VERSION') { specRefVersion = i.data; }
        });
        return specRefVersion;
    } catch (e) { console.error(e); return e; }
};

/**
 * Формирует из ресурсов коллекцию детализированных данных
 * для отправки в инетграционные сервисы, возвращает Promise
 * @param {object} s - конфигурация
 * @param {object} m - справочник MDP365
 * @return {string|object}
 */
exports.getDetailedLocations = async (s, m) => {
    try {
        /** Locations */
        let r = await getLocations(s);
        let result = [];
        for (let i of r.location) {
            let k = await getLocation(s, i);
            result.push(Object.assign(k, { location: i }));
        }
        r = result.filter(i => !!i)
            .filter(i => !!i.roomList)
            .filter(i => i.source && i.source.indexOf('PORTAL') !== -1);
        r.forEach(i => {
            delete i.employeePositionList;
            delete i.specializationList;
            delete i.service;
            delete i.equipmentUnitList;
            delete i.bedList;
            delete i.organization;
            delete i.source;
            delete i.beginDate;
            delete i.endDate;
            delete i.system;
        });
        /** Times */
        for (let i of r) {
            let rr = [];
            for (let date of createDates()) {
                let k = await getTimes(s, i.location, date);
                if (k && k.timePeriod) {
                    k.date = date;
                    rr.push(k);
                }
            }
            if (rr.length === 0) { rr = null; }
            Object.assign(i, { interval: rr });
        }
        r = r.filter(i => !!i.interval);
        r.forEach(i => {
            i.interval.forEach(j => {
                j.timePeriod = j.timePeriod.filter(k => {
                    let kns = k.notAvailableSources;
                    let knsns = (kns) ? k.notAvailableSources.notAvailableSource : null;
                    return (kns && Array.isArray(knsns)) ? !knsns.some(k => k.source === 'PORTAL') : true;
                });
                j.timePeriod.forEach(k => {
                    delete k.availableServices;
                    delete k.notAvailableSources;
                });
            });
            i.interval = i.interval.filter(j => j.timePeriod.length > 0);
        });
        r = r.filter(i => i.interval.length > 0);
        let emps = await getDetailedEmployees(s);
        for (let e of emps) {
            for (let i of r) {
                if (i.name.toUpperCase().indexOf(e.fio) !== -1) {
                    Object.assign(i, e);
                }
                let csFio = i.surname + ' ' + i.firstName + ' ' + i.patrName;
                let positionName = i.name.toUpperCase().replace(csFio.toUpperCase(), '').trim();
                Object.assign(i, { positionName: positionName });
            }
        }
        r = r.filter(i => !!i.positionName);
        for (let i of r) {
            let k = await getIndividualDocuments(s, i.individual);
            if (Array.isArray(k)) {
                await k.some(async j => {
                    let rr = await getDocument(s, j);
                    if (rr && rr.number && isSnils(rr.number)) {
                        Object.assign(i, { snils: snils(rr.number) });
                        return true;
                    }
                });
            } else {
                let rr = await getDocument(s, k);
                if (rr && rr.number && isSnils(rr.number)) {
                    Object.assign(i, { snils: snils(rr.number) });
                }
            }
            k = await getRoom(s, i.roomList.Room[0].room);
            Object.assign(i, { room: k.name });
            delete i.roomList;
            k = m.map(i => i.name.toUpperCase());
            k = ss.findBestMatch(i.positionName.toUpperCase(), k);
            k = m.map(i => i.name.toUpperCase()).indexOf(k.bestMatch.target);
            k = m[k].code;
            Object.assign(i, { position: k });
            /* let specRefCode = await getRefCode(s, 'pim_speciality');
            let specRefVersion = await getRefVersion(s, specRefCode);
            let specRefBook = await getRefbook(s, { code: specRefCode, version: specRefVersion });
            let x; let y;
            specRefBook.row.forEach((ii, idx) => {
                ii.column.forEach((jj, idy) => {
                    if (jj.name === 'ID' && parseInt(jj.data) === parseInt(i.speciality)) {
                        x = idx;
                    }
                    if (jj.name === 'CODE') { y = idy; }
                });
            });
            Object.assign(i, { speciality: specRefBook.row[x].column[y].data });
            let posRefCode = await getRefCode(s, 'pim_position_role');
            let posRefVersion = await getRefVersion(s, posRefCode);
            let posRefBook = await getRefbook(s, { code: posRefCode, version: posRefVersion });
            posRefBook.row.forEach((ii, idx) => {
                ii.column.forEach((jj, idy) => {
                    if (jj.name === 'NAME'
                        && ss.compareTwoStrings(jj.data.toUpperCase(), i.positionName.toUpperCase()) > 0.9) {
                        x = idx;
                    }
                    if (jj.name === 'CODE') { y = idy; }
                });
            });
            Object.assign(i, { position: posRefBook.row[x].column[y].data }); */
            k = await getDepartment(s, i.department);
            Object.assign(i, { department: { code: k.code, name: k.name, type: k.departmentType } });
        }
        /** SpecialityId, PositionId, Individual, Documents, Rooms */
        /* await r.reduce((p, c) => p.then(async () => {
            let k = await getEmployeePosition(s, c.employeePositionList.EmployeePosition[0].employeePosition);
            delete c.employeePositionList;
            Object.assign(c, { position: k.position }); // TODO: k.position может быть массив
            Object.assign(c, { employee: k.employee });
            k = await getEmployee(s, k.employee);
            Object.assign(c, { individual: k.individual });
            k = await getIndividual(s, k.individual);
            Object.assign(c, { firstname: k.name, surname: k.surname, patrName: k.patrName });
            k = await getIndividualDocuments(s, c.individual);
            if (Array.isArray(k)) {
                k.some(async i => {
                    let rr = await getDocument(s, i);
                    if (rr && rr.number && isSnils(rr.number)) {
                        Object.assign(c, { snils: snils(rr.number) });
                        return true;
                    }
                });
            } else {
                let rr = await getDocument(s, k);
                if (rr && rr.number && isSnils(rr.number)) {
                    Object.assign(c, { snils: snils(rr.number) });
                }
            }
            k = await getRoom(s, c.roomList.Room[0].room);
            Object.assign(c, { room: k.name });
            delete c.roomList;
            k = await getEmployeeSpecialities(s, c.employee);
            k = (Array.isArray(k.speciality)) ? k.speciality[0] : k.speciality;
            Object.assign(c, { speciality: k });
            k = await getDepartment(s, c.department);
            Object.assign(c, { department: { code: k.code, name: k.name, type: k.departmentType } });
            let specRefCode = await getRefCode(s, 'pim_speciality');
            let specRefVersion = await getRefVersion(s, specRefCode);
            let specRefBook = await getRefbook(s, { code: specRefCode, version: specRefVersion });
            let x; let y;
            specRefBook.row.forEach((i, idx) => {
                i.column.forEach((j, idy) => {
                    if (j.name === 'ID' && parseInt(j.data) === parseInt(c.speciality)) {
                        x = idx;
                    }
                    if (j.name === 'CODE') { y = idy; }
                });
            });
            Object.assign(c, { speciality: specRefBook.row[x].column[y].data });
            let posRefCode = await getRefCode(s, 'pim_position_role');
            let posRefVersion = await getRefVersion(s, posRefCode);
            let posRefBook = await getRefbook(s, { code: posRefCode, version: posRefVersion });
            posRefBook.row.forEach((i, idx) => {
                i.column.forEach((j, idy) => {
                    if (j.name === 'ID' && parseInt(j.data) === parseInt(c.position)) {
                        x = idx;
                    }
                    if (j.name === 'CODE') { y = idy; }
                });
            });
            Object.assign(c, { position: posRefBook.row[x].column[y].data });
            return c;
        }), Promise.resolve());*/
        r = r.filter(i => !!i.snils)
            .filter(i => !!i.name)
            .filter(i => !!i.firstName)
            .filter(i => !!i.surname)
            .filter(i => !!i.patrName)
            .filter(i => !!i.speciality)
            .filter(i => !!i.room);
        return r;
    } catch (e) { return e; }
};
