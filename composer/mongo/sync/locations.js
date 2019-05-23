const Department = require('../model/department')
const Location = require('../model/location')
const rmisjs = require('../../../index')
const get = require('../../../libs/getter')

/**
 * Выгрузка данных из РМИС о ресурсах
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
  let resource = await rmisjs(s).rmis.resource()
  let ids = resource.getLocations({
    clinic: s.rmis.clinicId
  })
  let depts = await Department.distinct('_id').exec()
  await Promise.all(
    []
      .concat(
        Location.remove({
          department: {
            $nin: depts
          }
        }).exec()
      )
      .concat(
        get(await ids, [], 'location').map(async id => {
          try {
            let location = await resource.getLocation({
              location: id
            })
            if (!location) return
            else location = location.location
            location.service = [].concat(location.service || [])
            if (
              depts.indexOf(parseInt(location.department)) < 0 ||
              !location.source ||
              !location.employeePositionList ||
              !location.service.length
            )
              return await Location.remove({ _id: id }).exec()
            location.positions = location.employeePositionList.EmployeePosition.map(
              i => i.employeePosition
            )
            location.rooms = get(location, [], 'roomList', 'Room').map(
              i => i.room
            )
            location._id = id
            await Location.update(
              {
                _id: id
              },
              location,
              {
                upsert: true
              }
            ).exec()
          } catch (e) {
            console.error(e)
          }
        })
      )
  )
}
