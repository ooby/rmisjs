const createDates = require('../../libs/collect').createDates;
const TimeSlot = require('../model/timeslot');
const Location = require('../model/location');
const moment = require('moment');

const toMidnight = dateString => moment(dateString).toDate();

const update = async(date, location, organization, appointmentService) => {
    let midnight = toMidnight(date);
    let times = await appointmentService.getTimes({
        location,
        date
    });
    times = (
        (!!times.interval.timePeriod ? times.interval.timePeriod : [])
        .map(i => {
            return {
                from: new Date(`${date}T${i.from}`),
                to: new Date(`${date}T${i.to}`),
                date: midnight,
                status: 1,
                location,
                unavailable: i.notAvailableSources ? i.notAvailableSources.notAvailableSource.map(i => i.source) : [],
                services: i.availableServices ? i.availableServices.service : []
            };
        })
    );
    let tmp = await appointmentService.getReserveFiltered({
        date,
        organization,
        location
    });
    let froms = times.map(i => i.from);
    times = (
        (times || [])
        .concat(
            ((tmp || []).slot || [])
            .filter(i => !!i.timePeriod.to)
            .map(i => {
                return {
                    from: new Date(`${date}T${i.timePeriod.from}`),
                    to: new Date(`${date}T${i.timePeriod.to}`),
                    date: midnight,
                    location,
                    status: i.status
                };
            })
            .filter(i => froms.indexOf(i.from.valueOf()) < 0)
        )
    );
    froms = times.map(i => i.from);
    await TimeSlot.remove({
        location,
        date: midnight,
        from: {
            $nin: froms
        }
    }).exec();
    let existing = await TimeSlot.distinct('from', {
        date: midnight,
        location
    }).exec();
    existing = existing.map(i => i.valueOf());
    let promises = [];
    for (let time of times) {
        try {
            let from = time.from.valueOf();
            if (existing.indexOf(from) < 0) {
                promises.push(new TimeSlot(time).save());
                existing.push(from);
            } else {
                promises.push(
                    TimeSlot.update({
                        from: time.from,
                        location
                    }, {
                        $set: {
                            to: time.to,
                            status: time.status
                        }
                    }).exec()
                );
            }
        } catch (e) {
            console.error(e);
        }
    }
    await Promise.all(promises);
};

module.exports = async(rmis, clinicId) => {
    let appointmentService = await rmis.appointment();
    let dates = createDates();
    let locs = await Location.distinct('_id').exec();
    await TimeSlot.remove({
        $or: [
            {
                date: {
                    $nin: dates.map(i => toMidnight(i))
                }
            },
            {
                location: {
                    $nin: locs
                }
            }
        ]
    }).exec();
    for (let loc of locs) {
        for (let date of dates) {
            await update(date, loc, clinicId, appointmentService);
        }
    }
};
