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
    getRoom,
    getTimes
} = require('./collect');
exports.getDetailedLocations = s => {
    return new Promise(async (resolve, reject) => {
        try {
            // Locations
            let r = await getLocations(s);
            let result = [];
            await r.location.reduce((p, c) => p.then(async () => {
                let k = await getLocation(s, c);
                result.push(Object.assign(k, { location: c }));
                return c;
            }), Promise.resolve());
            r = result.filter(i => !!i)
                .filter(i => !!i.roomList)
                .filter(i => !!i.specializationList)
                .filter(i => i.source && i.source.indexOf('PORTAL') !== -1);
            r.forEach(i => {
                delete i.service;
                delete i.equipmentUnitList;
                delete i.bedList;
                delete i.organization;
                delete i.source;
                delete i.beginDate;
                delete i.endDate;
                delete i.system;
            });
            // Times
            await r.reduce((p, c) => p.then(async () => {
                let rr = [];
                for (let date of createDates()) {
                    let k = await getTimes(s, c.location, date);
                    if (k && k.timePeriod) {
                        k.date = date;
                        rr.push(k);
                    }
                }
                if (rr.length === 0) { rr = null; }
                Object.assign(c, { interval: rr });
                return c;
            }), Promise.resolve());
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
                delete i.specializationList;
                i.interval = i.interval.filter(j => j.timePeriod.length > 0);
            });
            r = r.filter(i => i.interval.length > 0);
            // Speciality, Position, Individual, Documents, Rooms
            await r.reduce((p, c) => p.then(async () => {
                let k = await getEmployeePosition(s, c.employeePositionList.EmployeePosition[0].employeePosition);
                delete c.employeePositionList;
                Object.assign(c, { position: k.position });
                Object.assign(c, { employee: k.employee });
                k = await getEmployee(s, k.employee);
                Object.assign(c, { individual: k.individual });
                k = await getIndividual(s, k.individual);
                Object.assign(c, { name: k.name, surname: k.surname, patrName: k.patrName });
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
                if (!Array.isArray(k)) {
                    Object.assign(c, k);
                }
                k = await getDepartment(s, c.department);
                Object.assign(c, { department: { code: k.code, name: k.name, type: k.departmentType } });
                return c;
            }), Promise.resolve());
            r = r.filter(i => !!i.snils)
                .filter(i => !!i.position)
                .filter(i => !!i.name)
                .filter(i => !!i.surname)
                .filter(i => !!i.patrName)
                .filter(i => !!i.speciality)
                .filter(i => !!i.room);
            resolve(r);
        } catch (e) { reject(e); }
    });
};