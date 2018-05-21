const TimeSlot = require('../model/timeslot');
const mongoose = require('mongoose');

module.exports = async s => {
    await mongoose
        .connection
        .collection('appcaches')
        .remove({
            'times.from': {
                $lte: new Date()
            }
        });
    await TimeSlot
        .appCache(s.sources)
        .out('appcaches')
        .exec();
};
