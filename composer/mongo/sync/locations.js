const Location = require('../model/location');
const Department = require('../model/department');
const rmisjs = require('../../../index');
const Queue = require('../queue');
const get = require('../getter');

const q = new Queue(2);

/**
 * Выгрузка данных из РМИС о ресурсах
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
    console.log('Syncng locations...');
    let resource = await rmisjs(s).rmis.resource();
    let ids = resource.getLocations({
        clinic: s.rmis.clinicId
    });
    let depts = await Department.distinct('_id').exec();
    let removal = Location.remove({
        department: {
            $nin: depts
        }
    }).exec();
    await Promise.all(
        [].concat(
            Location.remove({
                department: {
                    $nin: depts
                }
            }).exec()
        ).concat(
            get(await ids, [], 'location').map(async id => {
                let location = await q.push(() =>
                    resource.getLocation({
                        location: id
                    })
                );
                if (!location) return;
                else location = location.location;
                if (
                    depts.indexOf(parseInt(location.department)) < 0 ||
                    !location.source ||
                    !location.employeePositionList
                ) {
                    return await Location.remove({
                        _id: id
                    }).exec();
                };
                location.positions = location.employeePositionList.EmployeePosition.map(i => i.employeePosition);
                location.rooms = get(location, [], 'roomList', 'Room').map(i => i.room);
                location._id = id;
                await Location.update({
                    _id: id
                }, location, {
                    upsert: true
                }).exec();
            })
        )
    );
};
