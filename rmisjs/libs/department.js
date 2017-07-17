module.exports = c => {
    return {
        describe: () => c.describe(),
        getDepartment: d => {
            return new Promise((resolve, reject) => {
                c.getDepartment(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getDepartments: d => {
            return new Promise((resolve, reject) => {
                c.getDepartments(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};