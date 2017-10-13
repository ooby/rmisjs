module.exports = c => {
    return {
        describe: () => c.describe(),
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
