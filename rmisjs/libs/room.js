const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(2);

module.exports = async s => {
    let c = await createClient(s, 'room');
    return {
        describe: () => c.describe(),
        getRoom: d => q.push(() => c.getRoomAsync(d)),
        getRooms: d => q.push(() => c.getRoomsAsync(d))
    };
};
