const {
    getRoom,
    getRooms
} = require('./collect');

exports.getDetailedRooms = async s => {
    try {
        let r = await getRooms(s);
        let result = [];
        for (let i of r.room) {
            let k = await getRoom(s, i);
            result.push(k);
        }
        return result;
    } catch (e) {
        console.error(e);
        return e;
    }
};