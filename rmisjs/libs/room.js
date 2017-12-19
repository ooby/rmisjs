const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'room');
    return {
        describe: () => c.describe(),
        getRoom: d => c.getRoomAsync(d),
        getRooms: d => c.getRoomsAsync(d)
    };
};
