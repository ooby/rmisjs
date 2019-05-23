const Service = require('../model/service')
const rmisjs = require('../../../index')

/**
 * Выгрузка данных из РМИС об услугах
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
  let servicesService = await rmisjs(s).rmis.services()
  let services = await servicesService.getServices({
    clinic: s.rmis.clinicId
  })
  services = services.services
  await Promise.all(
    []
      .concat(
        Service.remove({
          _id: {
            $nin: services.map(i => i.id)
          }
        })
      )
      .concat(
        services.map(async service => {
          try {
            service = {
              _id: service.id,
              name: service.name
            }
            service.repeated = /повтор/i.test(service.name)
            let details = await servicesService.getService({
              serviceId: service._id
            })
            details = details.service
            if (details.repeated) service.repeated = details.repeated
            await Service.update(
              {
                _id: service._id
              },
              service,
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
