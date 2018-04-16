const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'patient');
    return {
        describe: () => c.describe(),
        createPatient: d => wrap(q, () => c.createPatientAsync(d)),
        getPatient: d => wrap(q, () => c.getPatientAsync(d)),
        getPatientReg: d => wrap(q, () => c.getPatientRegAsync(d)),
        getPatientRegs: d => wrap(q, () => c.getPatientRegsAsync(d)),
        searchPatient: d => wrap(q, () => c.searchPatientAsync(d))
    };
};
