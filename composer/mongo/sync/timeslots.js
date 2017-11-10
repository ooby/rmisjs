const { TimeSlot, Location } = require('../model');
const dates = require('./dates');

const createPair = (a, b) => {
    a = Math.floor(a / 60000);
    b = Math.floor(b / 60000);
    return a.toString() + ':' + (b - a).toString();
};

const updateTimeSlots = async (appointmentService) => {
    let locations = await Location.find().distinct('rmisId').exec();
    await TimeSlot.remove({
        $or: [
            { location: { $nin: locations } },
            { from: { $lte: new Date(dates[0]) } }
        ]
    }).exec();
    for (let location of locations) {
        for (let date of dates) {
            let { interval } = await appointmentService.getTimes({ location, date });
            let pairs = [];
            interval = 'timePeriod' in interval? interval.timePeriod: [];
            for (let slot of interval) {
                let from = new Date(`${date}T${slot.from}`);
                let to = new Date(`${date}T${slot.to}`);
                let pair = createPair(from, to);
                pairs.push(pair);
                let existing = await TimeSlot.findOne({ location, pair }).exec();
                if (!!existing) continue;
                await new TimeSlot({
                    location,
                    pair,
                    from,
                    to,
                }).save();
            }
            await TimeSlot.remove({
                location,
                pair: { $nin: pairs }
            }).exec();
        }
    }
};

module.exports = updateTimeSlots;
