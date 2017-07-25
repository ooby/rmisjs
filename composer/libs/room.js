const { getRoom, getRooms } = require('./collect');
exports.getDetailedRooms = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getRooms(s);
            let result = [];
            await r.room.reduce((p, c) => p.then(async () => {
                let k = await getRoom(s, i);
                result.push(k);
                return c;
            }), Promise.resolve());
            resolve(result);
        } catch (e) { reject(e); }
    });
};