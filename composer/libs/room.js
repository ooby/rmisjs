const getRoom = async (s, id) => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.room();
        r = await r.getRoom({ roomId: id });
        r = (r) ? r.room : null;
        return r;
    } catch (e) { return e; };
};
const getRooms = async s => {
    const rmisjs = require('../../index')(s);
    const rmis = rmisjs.rmis;
    try {
        let r = await rmis.room();
        r = await r.getRooms({ clinic: s.rmis.clinicId });
        return r;
    } catch (e) { return e; }
};
exports.getDetailedRooms = s => {
    return new Promise(async (resolve, reject) => {
        try {
            let r = await getRooms(s);
            let result = [];
            await r.room.reduce((p, c) => p.then(async () => {
                let k = await getRoom(s, c);
                result.push(k);
                return c;
            }), Promise.resolve());
            resolve(result);
        } catch (e) { reject(e); }
    });
};