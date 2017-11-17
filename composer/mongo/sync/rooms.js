const { Room, Location } = require('../model');

module.exports = async (rmis) => {
    const roomService = await rmis.room();
    let rooms = await Location.distinct('rooms').exec();
    await Room.remove({ rmisId: { $nin: rooms } }).exec();
    for (let roomId of rooms) {
        let { room } = await roomService.getRoom({ roomId });
        room.rmisId = roomId;
        await Room.update({
            rmisId: roomId
        }, room, {
            upsert: true
        }).exec();
    }
};
