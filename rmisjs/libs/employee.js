module.exports = c => {
    return {
        describe: () => c.describe(),
        getEmployee: d => new Promise((resolve, reject) => {
            c.getEmployee(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getEmployees: d => new Promise((resolve, reject) => {
            c.getEmployees(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getEmployeePosition: d => new Promise((resolve, reject) => {
            c.getEmployeePosition(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getEmployeePositions: d => new Promise((resolve, reject) => {
            c.getEmployeePositions(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getEmployeeSpecialities: d => new Promise((resolve, reject) => {
            c.getEmployeeSpecialities(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getPosition: d => new Promise((resolve, reject) => {
            c.getPosition(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
