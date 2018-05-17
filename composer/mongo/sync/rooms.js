const Room = require('../model/room');
const Location = require('../model/location');
const rmisjs = require('../../../index');

/**
 * Выгрузка данных из РМИС о кабинетах
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    let [roomService, rooms] = await Promise.all([
        rmisjs(s).rmis.room(),
        Location.distinct('rooms').exec()
    ]);
    await Promise.all(
        [].concat(
            Room.remove({
                _id: {
                    $nin: rooms
                }
            }).exec()
        ).concat(
            rooms.map(async roomId => {
                let room = await roomService.getRoom({
                    roomId
                });
                room = room.room;
                room._id = roomId;
                await Room.update({
                    _id: roomId
                }, room, {
                    upsert: true
                }).exec();
            })
        )
    );
};
