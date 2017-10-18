module.exports = c => {
    return {
        describe: () => c.describe(),
        createAddress: d => new Promise((resolve, reject) => {
            c.createAddress(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddresses: d => new Promise((resolve, reject) => {
            c.getAddresses(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddressInfo: d => new Promise((resolve, reject) => {
            c.getAddressInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddressAllInfo: d => new Promise((resolve, reject) => {
            c.getAddressAllInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddressLevelInfo: d => new Promise((resolve, reject) => {
            c.getAddressLevelInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddressDisplayName: d => new Promise((resolve, reject) => {
            c.getAddressDisplayName(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getAddressType: d => new Promise((resolve, reject) => {
            c.getAddressType(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getBatchAddressInfo: d => new Promise((resolve, reject) => {
            c.getBatchAddressInfo(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        searchAddress: d => new Promise((resolve, reject) => {
            c.searchAddress(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getVersion: d => new Promise((resolve, reject) => {
            c.getVersion(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
