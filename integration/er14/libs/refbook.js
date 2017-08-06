module.exports = c => {
    return {
        getRefBookList: () => new Promise((resolve, reject) => {
            c.getRefBookList({}, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
