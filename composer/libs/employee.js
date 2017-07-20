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
exports.getDetailedEmployees = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getEmps(s);
            let result = [];
            await r.employee.reduce((p, c) => p.then(async () => {
                let k = await getEmp(s, c);
                result.push(k);
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
            resolve(r);
        } catch (e) { reject(e); }
    });
};