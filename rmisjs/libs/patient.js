const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'patient');
    return {
        describe: () => c.describe(),
        createPatient: d => c.createPatientAsync(d),
        getPatient: d => c.getPatientAsync(d),
        getPatientReg: d => c.getPatientRegAsync(d),
        getPatientRegs: d => c.getPatientRegsAsync(d)
    };
};
