module.exports = c => {
    return {
        describe: () => c.describe(),
        getRoom: d => {
            return new Promise((resolve, reject) => {
                c.getRoom(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getRooms: d => {
            return new Promise((resolve, reject) => {
                c.getRooms(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};