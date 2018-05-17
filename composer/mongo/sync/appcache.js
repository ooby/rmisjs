const TimeSlot = require('../model/timeslot');
const mongoose = require('mongoose');

module.exports = s =>
    TimeSlot.appCache(s.sources).out('appcaches').exec();
