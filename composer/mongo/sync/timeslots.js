const createDates = require('../../libs/collect').createDates;
const TimeSlot = require('../model/timeslot');
const Location = require('../model/location');
const moment = require('moment');

module.exports = async(rmis, clinicId) => {
    let promises = [];
    let dates = createDates();
    let [appointmentService, locations] = await Promise.all([
        rmis.appointment(),
        Location.find().distinct('_id').exec()
    ]);
    await TimeSlot.remove({
        $or: [{
                location: {
                    $nin: locations
                }
            },
            {
                date: {
                    $nin: dates
                }
            }
        ]
    }).exec();
    for (let location of locations) {
        for (let date of dates) {
            let froms = [];
            let midnight = moment(date + 'T00:00:00.000' + moment().format('Z')).toDate();
            let [existing, interval] = await Promise.all([
                TimeSlot.distinct('from', {
                    location,
                    date: midnight
                }).exec(),
                appointmentService.getTimes({
                    location,
                    date
                })
            ]);
            existing = existing.map(i => i.valueOf());
            interval = interval || {};
            interval = !!interval.interval.timePeriod ? interval.interval.timePeriod : [];
            for (let slot of interval) {
                let from = new Date(`${date}T${slot.from}`);
                let fromNum = from.valueOf();
                froms.push(fromNum);
                if (existing.indexOf(fromNum) > -1) continue;
                existing.push(fromNum);
                let to = new Date(`${date}T${slot.to}`);
                let unavailable = !!slot.notAvailableSources ? slot.notAvailableSources.notAvailableSource : [];
                unavailable = unavailable.map(i => i.source);
                let services = !!slot.availableServices ? slot.availableServices.service : [];
                promises.push(
                    new TimeSlot({
                        from,
                        location,
                        date: midnight,
                        to,
                        unavailable,
                        services
                    }).save()
                );
            }
            let reserve = await appointmentService.getReserveFiltered({
                date,
                organization: clinicId,
                location
            });
            reserve = reserve || {};
            reserve = !!reserve.slot ? reserve.slot : [];
            for (let slot of reserve) {
                if ('to' in slot.timePeriod === false) continue;
                let from = new Date(`${date}T${slot.timePeriod.from}`);
                let fromNum = from.valueOf();
                froms.push(fromNum);
                if (existing.indexOf(fromNum) < 0) {
                    existing.push(fromNum);
                    promises.push(
                        new TimeSlot({
                            location,
                            date: midnight,
                            from,
                            to: new Date(`${date}T${slot.timePeriod.to}`),
                            status: slot.status
                        }).save()
                    );
                } else {
                    promises.push(
                        TimeSlot.update({
                            from,
                            location,
                            date: midnight
                        }, {
                            $set: {
                                status: slot.status
                            }
                        }).exec()
                    );
                }
            }
            promises.push(
                TimeSlot.remove({
                    status: 1,
                    from: {
                        $nin: froms
                    },
                    location,
                    date: midnight
                }).exec()
            );
        }
    }
    await Promise.all(promises);
};
