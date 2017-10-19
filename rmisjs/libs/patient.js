module.exports = c => {
    return {
        describe: () => c.describe(),
        createPatient: d => new Promise((resolve, reject) => {
            c.createPatient(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getPatient: d => new Promise((resolve, reject) => {
            c.getPatient(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getPatientReg: d => new Promise((resolve, reject) => {
            c.getPatientReg(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getPatientRegs: d => new Promise((resolve, reject) => {
            c.getPatientRegs(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
