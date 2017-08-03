module.exports = c => {
    return {
        describe: () => c.describe(),
        getRefbook: d => new Promise((resolve, reject) => {
            c.getRefbook(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getRefbookList: d => new Promise((resolve, reject) => {
            c.getRefbookList(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getVersionList: d => new Promise((resolve, reject) => {
            c.getVersionList(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
