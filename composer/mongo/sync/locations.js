const Location = require('../model/location');
const Department = require('../model/department');

module.exports = async(rmis, clinic) => {
    let [resourceService, depts] = await Promise.all([
        rmis.resource(),
        Department.distinct('rmisId').exec()
    ]);
    let promises = [
        Location.remove({
            department: {
                $nin: depts
            }
        }).exec()
    ];
    for (let departmentId of depts) {
        let ids = await resourceService.getLocations({
            clinic,
            departmentId
        });
        ids = ids.location;
        promises.push(
            Location.remove({
                department: departmentId,
                rmisId: {
                    $nin: ids
                }
            }).exec()
        );
        for (let id of ids) {
            let location = await resourceService.getLocation({
                location: id
            });
            location = location.location;
            if (!location.source || !location.employeePositionList) continue;
            location.positions = location.employeePositionList.EmployeePosition.map(i => i.employeePosition);
            location.rooms = !!location.roomList ? location.roomList.Room : [];
            location.rooms = location.rooms.map(i => i.room);
            location.rmisId = id;
            promises.push(
                Location.update({
                    rmisId: id
                }, location, {
                    upsert: true
                }).exec()
            );
        }
    }
    await Promise.all(promises);
};