const createDates = require('../../libs/collect').createDates
const TimeSlot = require('../model/timeslot')
const Location = require('../model/location')
const moment = require('moment')
const get = require('../../../libs/getter')
const rmisjs = require('../../../index')

const toMidnight = dateString => moment(dateString).toDate()

let promises = []

const requestTime = (s, location, date, appointmentService) =>
  appointmentService.getTimes({
    location,
    date
  })

const requestReserve = (s, location, date, appointmentService) =>
  appointmentService.getReserveFiltered({
    date,
    organization: s.rmis.clinicId,
    location
  })

const update = async (s, date, location, appointmentService) => {
  try {
    let midnight = toMidnight(date)
    let reserved = requestReserve(s, location, date, appointmentService)
    let times = await requestTime(s, location, date, appointmentService)
    times = get(times, [], 'interval', 'timePeriod').map(i => {
      return {
        from: new Date(`${date}T${i.from}`),
        to: new Date(`${date}T${i.to}`),
        date: midnight,
        status: 1,
        location,
        unavailable: get(
          i,
          [],
          'notAvailableSources',
          'notAvailableSource'
        ).map(i => i.source),
        services: get(i, [], 'availableServices', 'service')
      }
    })
    let froms = times.map(i => i.from)
    times = times.concat(
      get(await reserved, [], 'slot')
        .filter(i => !!i.timePeriod.to)
        .map(i => {
          return {
            from: new Date(`${date}T${i.timePeriod.from}`),
            to: new Date(`${date}T${i.timePeriod.to}`),
            date: midnight,
            location,
            status: i.status
          }
        })
        .filter(i => froms.indexOf(i.from.valueOf()) < 0)
    )
    froms = times.map(i => i.from)
    await TimeSlot.remove({
      location,
      date: midnight,
      from: {
        $nin: froms
      }
    }).exec()
    let existing = await TimeSlot.distinct('from', {
      date: midnight,
      location
    }).exec()
    existing = existing.map(i => i.valueOf())
    for (let time of times) {
      let from = time.from.valueOf()
      if (existing.indexOf(from) < 0) {
        promises.push(new TimeSlot(time).save().catch(e => cosnole.error(e)))
        existing.push(from)
      } else {
        promises.push(
          TimeSlot.update(
            {
              from: time.from,
              location
            },
            {
              $set: {
                to: time.to,
                status: time.status
              }
            }
          )
            .exec()
            .catch(e => console.error(e))
        )
      }
    }
  } catch (e) {
    console.error(e)
  }
}

/**
 * Выгрузка данных из РМИС о расписании
 * @param {Object} s - конфигурация
 */
module.exports = async s => {
  let appointmentService = await rmisjs(s).rmis.appointment()
  let dates = createDates()
  let locations = await Location.distinct('_id').exec()
  await Promise.all(
    []
      .concat(
        TimeSlot.remove({
          $or: [
            {
              date: {
                $nin: dates.map(i => toMidnight(i))
              }
            },
            {
              location: {
                $nin: locations
              }
            }
          ]
        }).exec()
      )
      .concat(
        locations.map(location =>
          Promise.all(
            dates.map(async date => {
              try {
                await update(s, date, location, appointmentService)
              } catch (e) {
                console.error(e)
              }
            })
          )
        )
      )
  )
  await Promise.all(promises)
  promises = []
}
