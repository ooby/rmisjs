const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'room');
    return {
        describe: () => c.describe(),
        getRoom: d => wrap(q, () => c.getRoomAsync(d)),
        getRooms: d => wrap(q, () => c.getRoomsAsync(d))
    };
};
