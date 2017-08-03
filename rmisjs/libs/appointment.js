module.exports = c => {
    return {
        describe: () => c.describe(),
        getTimes: d => new Promise((resolve, reject) => {
            c.getTimes(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
