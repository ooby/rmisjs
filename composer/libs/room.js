const { getRoom, getRooms } = require('./collect');
exports.getDetailedRooms = async s => {
    try {
        let r = await getRooms(s);
        let result = [];
        await r.room.reduce((p, c) => p.then(async () => {
            let k = await getRoom(s, i);
            result.push(k);
            return c;
        }), Promise.resolve());
        return result;
    } catch (e) { return e; }
};
