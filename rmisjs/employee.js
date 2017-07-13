module.exports = c => {
    return {
        describe: () => c.describe(),
        getEmployee: d => {
            return new Promise((resolve, reject) => {
                c.getEmployee(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getEmployees: d => {
            return new Promise((resolve, reject) => {
                c.getEmployees(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getEmployeePosition: d => {
            return new Promise((resolve, reject) => {
                c.getEmployeePosition(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getEmployeePositions: d => {
            return new Promise((resolve, reject) => {
                c.getEmployeePositions(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getEmployeeSpecialities: d => {
            return new Promise((resolve, reject) => {
                c.getEmployeeSpecialities(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getPosition: d => {
            return new Promise((resolve, reject) => {
                c.getPosition(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};