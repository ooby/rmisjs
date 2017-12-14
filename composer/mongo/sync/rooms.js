const Room = require('../model/room');
const Location = require('../model/location');
const Queue = require('../queue');
const rmisjs = require('../../../index');

const q = new Queue(2);

/**
 * Выгрузка данных из РМИС о кабинетах
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    console.log('Syncing rooms...');
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
                let room = await q.push(() =>
                    roomService.getRoom({
                        roomId
                    })
                );
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
