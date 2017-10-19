module.exports = c => {
    return {
        describe: () => c.describe(),
        getTimes: d => new Promise((resolve, reject) => {
            c.getTimes(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        postReserve: d => new Promise((resolve, reject) => {
            c.postReserve(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        deleteSlot: d => new Promise((resolve, reject) => {
            c.deleteSlot(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getSlot: d => new Promise((resolve, reject) => {
            c.getSlot(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getReserve: d => new Promise((resolve, reject) => {
            c.getReserve(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getReserveFiltered: d => new Promise((resolve, reject) => {
            c.getReserveFiltered(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
