module.exports = c => {
    return {
        describe: () => c.describe(),
        getDistrict: d => new Promise((resolve, reject) => {
            c.getDistrict(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        searchDistricts: d => new Promise((resolve, reject) => {
            c.searchDistricts(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
