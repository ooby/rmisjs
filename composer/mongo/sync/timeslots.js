const createDates = require('../../libs/collect').createDates;
const TimeSlot = require('../model/timeslot');
const Location = require('../model/location');
const moment = require('moment');

const toMidnight = dateString => moment(dateString + 'T00:00:00.000' + moment().format('Z')).toDate();

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
        )
    );
    let froms = times.map(i => i.from);
    await TimeSlot.remove({
        location,
        date: midnight,
        from: {
            $nin: froms
        }
    }).exec();
    let existing = await Location.distinct('from', {
        date: midnight,
        location
    }).lean().exec();
    existing = existing.map(i => i.valueOf());
    for (let time of times) {
        try {
            let from = time.from.valueOf();
            if (existing.indexOf(from) < 0) {
                await new TimeSlot(time).save();
                existing.push(from);
            } else {
                await TimeSlot.update({
                    from: time.from,
                    location
                }, {
                    $set: {
                        to: time.to,
                        status: time.status
                    }
                }).exec();
            }
        } catch (e) {
            console.error(e);
        }
    }
};

module.exports = async(rmis, clinicId) => {
    let appointmentService = await rmis.appointment();
    let dates = createDates();
    let locs = await Location.distinct('_id').exec();
    await TimeSlot.remove({
        $or: [
            {
                date: {
                    $nin: dates
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
