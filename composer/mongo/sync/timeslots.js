const createDates = require('../../libs/collect').createDates;
const TimeSlot = require('../model/timeslot');
const Location = require('../model/location');
const moment = require('moment');

module.exports = async(rmis, clinicId) => {
    let promises = [];
    let dates = createDates();
    let [appointmentService, locations] = await Promise.all([
        rmis.appointment(),
        Location.find().distinct('rmisId').exec()
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
            let pairs = [];
            let scope = {
                location,
                date
            };
            let docScope = {
                location,
                date: moment(date + 'T00:00:00.00' + moment().format('Z'))
            };
            let [existing, interval] = await Promise.all([
                TimeSlot.distinct('pair', scope).exec(),
                appointmentService.getTimes(scope)
            ]);
            interval = interval || {};
            interval = !!interval.interval.timePeriod ? interval.interval.timePeriod : [];
            for (let slot of interval) {
                let doc = Object.assign({
                    from: new Date(`${date}T${slot.from}`),
                    to: new Date(`${date}T${slot.to}`)
                }, docScope);
                let pair = TimeSlot.createPair(doc);
                pairs.push(pair);
                if (existing.indexOf(pair) > -1) continue;
                doc.unavailable = !!slot.notAvailableSources ? slot.notAvailableSources.notAvailableSource : [];
                doc.unavailable = doc.unavailable.map(i => i.source);
                doc.services = !!slot.availableServices ? slot.availableServices.service : [];
                doc = new TimeSlot(doc);
                promises.push(doc.save());
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
                let doc = Object.assign({
                    from: new Date(`${date}T${slot.timePeriod.from}`),
                    to: new Date(`${date}T${slot.timePeriod.to}`),
                    status: slot.status
                }, docScope);
                let pair = TimeSlot.createPair(doc);
                pairs.push(pair);
                promises.push(
                    existing.indexOf(pair) < 0 ? new TimeSlot(doc).save() : TimeSlot.update(
                        Object.assign({
                            pair
                        }, scope), {
                            $set: {
                                status: doc.status
                            }
                        }
                    ).exec()
                );
            }
            promises.push(
                TimeSlot.remove(
                    Object.assign({
                        status: 1,
                        pair: {
                            $nin: pairs
                        }
                    }, scope)
                ).exec()
            );
        }
    }
    await Promise.all(promises);
};
