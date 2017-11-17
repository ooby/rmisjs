const { Location, Department } = require('../model');

module.exports = async (rmis, clinic) => {
    const resourceService = await rmis.resource();
    let depts = await Department.distinct('rmisId').exec();
    await Location.remove({ department: { $nin: depts } }).exec();
    for (let departmentId of depts) {
        let ids = await resourceService.getLocations({ clinic, departmentId });
        ids = ids.location;
        await Location.remove({
            department: departmentId,
            rmisId: { $nin: ids }
        }).exec();
        for (let id of ids) {
            let { location } = await resourceService.getLocation({
                location: id
            });
            if (!location.source || !location.employeePositionList) continue;
            Object.assign(location, {
                rmisId: id,
                positions: location.employeePositionList.EmployeePosition.map(i => i.employeePosition),
                rooms: (!!location.roomList? location.roomList.Room: [])
                        .map(i => i.room)
            });
            await Location.update({
                rmisId: id
            }, location, {
                upsert: true
            }).exec();
        }
    }
};
