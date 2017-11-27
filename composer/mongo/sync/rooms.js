const Room = require('../model/room');
const Location = require('../model/location');

module.exports = async(rmis) => {
    let [roomService, rooms] = await Promise.all([
        rmis.room(),
        Location.distinct('rooms').exec()
    ]);
    let promises = [
        Room.remove({
            _id: {
                $nin: rooms
            }
        }).exec()
    ];
    for (let roomId of rooms) {
        let room = await roomService.getRoom({
            roomId
        });
        room = room.room;
        room._id = roomId;
        promises.push(
            Room.update({
                _id: roomId
            }, room, {
                upsert: true
            }).exec()
        );
    }
    await Promise.all(promises);
};
