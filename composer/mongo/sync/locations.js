const { Location } = require('../model');

const updateLocations = async (resourceService, clinic) => {
    let ids = await resourceService.getLocations({ clinic });
    ids = ids.location;
    await Location.remove({
        rmisId: { $nin: ids }
    }).exec();
    for (let id of ids) {
        let { location } = await resourceService.getLocation({
            location: id
        });
        if (!location.source) continue;
        if (!location.roomList) {
            location.rooms = [];
        } else {
            location.rooms = location.roomList.Room.map(i => i.room);
        }
        location.rmisId = id;
        await Location.update({
            rmisId: id
        }, location, {
            upsert: true
        }).exec();
    }
};

module.exports = updateLocations;
