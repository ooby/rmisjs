const { TimeSlot, Location } = require('../model');
const { createDates } = require('../../libs/collect');

module.exports = async (rmis) => {
    const appointmentService = await rmis.appointment();
    let dates = createDates();
    let locations = await Location.find().distinct('rmisId').exec();
    await TimeSlot.remove({
        $or: [
            { location: { $nin: locations } },
            { date: { $nin: dates } }
        ]
    }).exec();
    for (let location of locations) {
        for (let date of dates) {
            let existing = await TimeSlot.distinct('pair', { location, date }).exec();
            let pairs = [];
            let { interval } = await appointmentService.getTimes({ location, date });
            interval = 'timePeriod' in interval? interval.timePeriod: [];
            for (let slot of interval) {
                let doc = new TimeSlot({
                    location,
                    date,
                    from: new Date(`${date}T${slot.from}`),
                    to: new Date(`${date}T${slot.to}`)
                });
                doc.createPair();
                pairs.push(doc.pair);
                if (existing.indexOf(doc.pair) > -1) continue;
                doc.unavailable = !!slot.notAvailableSources? slot.notAvailableSources.notAvailableSource: [];
                doc.unavailable = doc.unavailable.map(i => i.source);
                doc.services = !!slot.availableServices? slot.availableServices.service: [];
                doc.createUUID();
                await doc.save();
            }
            await TimeSlot.remove({
                location,
                date,
                pair: { $nin: pairs }
            }).exec();
        }
    }
};
