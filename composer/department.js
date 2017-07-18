const getDep = async (s, id) => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.department();
        r = await r.getDepartment({ departmentId: id });
        r = (r) ? r.department : null;
        return r;
    } catch (e) { return e; };
};
const getDeps = async (s) => {
    const rmisjs = require('../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.department();
        r = await r.getDepartments({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; };
};
exports.getDetailedDepartments = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getDeps(s);
            let result = [];
            await r.department.reduce((p, c) => p.then(async () => {
                let k = await getDep(s, c);
                result.push(k);
                return c;
            }), Promise.resolve());
            resolve(result);
        } catch (e) { reject(e); }
    });
};