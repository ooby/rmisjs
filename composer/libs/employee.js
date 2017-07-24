const getEmp = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.employee();
        r = await r.getEmployee({ id: id });
        r = (r) ? r.employee : null;
        return r;
    } catch (e) { return e; };
};
const getEmps = async s => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.employee();
        r = await r.getEmployees({ organization: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
const getEmpSpec = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.employee();
        r = await r.getEmployeeSpecialities({ employee: id });
        return r;
    } catch (e) { return e; };
};
const getEmpPositions = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.employee();
        r = await r.getEmployeePositions({ employee: id });
        return r;
    } catch (e) { return e; };
};
const getEmpPosition = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.employee();
        r = await r.getEmployeePosition({ id: id });
        r = (r) ? r.employeePosition : null;
        return r;
    } catch (e) { return e; };
};
const getInd = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.individual();
        r = await r.getIndividual(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};
const getIndDocs = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.individual();
        r = await r.getIndividualDocuments(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};
const getDoc = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.individual();
        r = await r.getDocument(id);
        r = (r) ? r : null;
        return r;
    } catch (e) { return e; };
};
const isSnils = s => (s.replace(/-/g, '').replace(/ /g, '').length === 11) ? true : false;
const snils = s => s.replace(/-/g, '').replace(/ /g, '');
exports.getDetailedEmployees = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getEmps(s);
            let result = [];
            await r.employee.reduce((p, c) => p.then(async () => {
                let k = await getEmp(s, c);
                result.push(Object.assign(k, { id: c }));
                return c;
            }), Promise.resolve());
            r = result.filter(i => !!i).filter(i => !!i.individual);
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getInd(s, c.individual);
                result.push(Object.assign(c, k));
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getEmpSpec(s, c.id);
                result.push(Object.assign(c, k));
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getIndDocs(s, c.individual);
                if (k) {
                    if (Array.isArray(k.employeePosition)) {
                        result.push(Object.assign(c, k));
                    } else {
                        k = await getDoc(s, k.document);
                        if (k.number && isSnils(k.number)) {
                            result.push(Object.assign(c, { snils: snils(k.number) }));
                        }
                    }
                }
                return c;
            }), Promise.resolve());
            r = result;
            result = [];
            await r.reduce((p, c) => p.then(async () => {
                let k = await getEmpPositions(s, c.id);
                if (k) {
                    if (Array.isArray(k.employeePosition)) {
                        let rr = [];
                        k.employeePosition.forEach(async i => {
                            let j = await getEmpPosition(s, i);
                            rr.push(j.position);
                        });
                        result.push(Object.assign(c, { position: rr }));
                    } else {
                        k = await getEmpPosition(s, k.employeePosition);
                        result.push(Object.assign(c, { position: k.position }));
                    }
                }
                return c;
            }), Promise.resolve());
            r = result;
            r = r.filter(i => !!i.speciality).filter(i => !!i.position)
                .filter(i => !!(Array.isArray(i.position) && i.position.length > 0));
            resolve(r);
        } catch (e) { reject(e); }
    });
};