const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'room'));
    return {
        describe: () => c.describe(),
        getRoom: d => wrap(q, () => c.getRoomAsync(d)),
        getRooms: d => wrap(q, () => c.getRoomsAsync(d))
    };
};
