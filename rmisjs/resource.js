module.exports = c => {
    return {
        describe: () => c.describe(),
        getLocation: d => {
            return new Promise((resolve, reject) => {
                c.getLocation(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getLocations: d => {
            return new Promise((resolve, reject) => {
                c.getLocations(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};