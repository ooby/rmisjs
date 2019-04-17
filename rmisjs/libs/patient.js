const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'patient'));
    return {
        describe: () => c.describe(),
        createPatient: d => wrap(q, () => c.createPatientAsync(d)),
        getPatient: d => wrap(q, () => c.getPatientAsync(d)),
        getPatientReg: d => wrap(q, () => c.getPatientRegAsync(d)),
        getPatientRegs: d => wrap(q, () => c.getPatientRegsAsync(d)),
        searchPatient: d => wrap(q, () => c.searchPatientAsync(d))
    };
};
