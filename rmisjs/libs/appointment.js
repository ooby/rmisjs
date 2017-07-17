module.exports = c => {
    return {
        describe: () => c.describe(),
        getTimes: d => {
            return new Promise((resolve, reject) => {
                c.getTimes(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};