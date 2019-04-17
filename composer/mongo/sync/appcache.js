const TimeSlot = require('../model/timeslot');
const mongoose = require('mongoose');
const moment = require('moment');

module.exports = async s => {
    try {
        await TimeSlot.appCache(s.sources)
            .out('appcaches')
            .exec();
        await mongoose.connection.collection('appcaches').remove({
            'times.from': {
                $lt: moment()
                    .hour(0)
                    .minute(0)
                    .second(0)
                    .toDate()
            }
        });
    } catch (e) {
        console.error(e);
    }
};
