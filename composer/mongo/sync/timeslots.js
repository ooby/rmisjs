const {
    TimeSlot,
    Location
} = require('../model');
const {
    createDates
} = require('../../libs/collect');

module.exports = async(rmis, clinicId) => {
    const appointmentService = await rmis.appointment();
    let dates = createDates();
    let locations = await Location.find().distinct('rmisId').exec();
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
            let existing = await TimeSlot.distinct('pair', {
                location,
                date
            }).exec();
            let pairs = [];
            let interval = await appointmentService.getTimes({
                location,
                date
            });
            interval = !!interval.interval.timePeriod ? interval.interval.timePeriod : [];
            for (let slot of interval) {
                let doc = new TimeSlot({
                    location,
                    date,
                    from: new Date(`${date}T${slot.from}`),
                    to: new Date(`${date}T${slot.to}`)
                });
                pairs.push(doc.createPair());
                if (existing.indexOf(doc.pair) > -1) continue;
                doc.unavailable = !!slot.notAvailableSources ? slot.notAvailableSources.notAvailableSource : [];
                doc.unavailable = doc.unavailable.map(i => i.source);
                doc.services = !!slot.availableServices ? slot.availableServices.service : [];
                doc.createUUID();
                await doc.save();
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
                let doc = new TimeSlot({
                    location,
                    date,
                    from: new Date(`${date}T${slot.timePeriod.from}`),
                    to: new Date(`${date}T${slot.timePeriod.to}`),
                    status: slot.status
                });
                pairs.push(doc.createPair());
                if (existing.indexOf(doc.pair) > -1) {
                    await TimeSlot.update({
                        location,
                        pair: doc.pair,
                        date,
                    }, {
                        $set: {
                            status: doc.status
                        }
                    }).exec();
                } else {
                    doc.createUUID();
                    await doc.save();
                }
            }
            await TimeSlot.remove({
                location,
                date,
                pair: {
                    $nin: pairs
                }
            }).exec();
        }
    }
};