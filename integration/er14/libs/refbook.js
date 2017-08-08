module.exports = c => {
    return {
        getRefBookList: () => new Promise((resolve, reject) => {
            c.getRefBookList({}, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getRefBookParts: d => new Promise((resolve, reject) => {
            c.getRefBookParts(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getRefBookPartial: d => new Promise((resolve, reject) => {
            c.getRefBookPartial(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
