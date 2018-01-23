const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s, 'patient');
    return {
        describe: () => c.describe(),
        createPatient: d => q.push(() => c.createPatientAsync(d)),
        getPatient: d => q.push(() => c.getPatientAsync(d)),
        getPatientReg: d => q.push(() => c.getPatientRegAsync(d)),
        getPatientRegs: d => q.push(() => c.getPatientRegsAsync(d)),
        searchPatient: d => q.push(() => c.searchPatientAsync(d))
    };
};
