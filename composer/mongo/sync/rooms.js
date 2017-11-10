const { Room } = require('../model');

const updateRooms = async (roomService, clinic) => {
    let rooms = await roomService.getRooms({ clinic });
    rooms = rooms.room;
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

module.exports = updateRooms;
