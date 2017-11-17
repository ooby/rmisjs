const mongoose = require('mongoose');
const { Schema } = mongoose;
const uuid = require('uuid/v4');
const moment = require('moment');

const toMinutes = a => Math.floor(a / 60000);
const cantor = (x, y) => (x + y) * (x + y + 1) * .5 + y;

const TimeSlotSchema = new Schema({
    from: { type: Date, required: true },
    to: { type: Date, required: true },
    pair: Number,
    date: { type: String, required: true },
    unavailable: [String],
    services: [Number],
    location: { type: Number, required: true },
    reserved: { type: Boolean, default: false, required: true },
    uuid: String
});

TimeSlotSchema.statics.getByLocation = function(location, ...args) {
    return this.find({ location }, ...args);
};

TimeSlotSchema.statics.getByUUID = function(uuid, ...args) {
    return this.findOne({ uuid }, ...args);
};

TimeSlotSchema.methods.createPair = function() {
    let date = new Date(moment(this.from).format('GGGG-MM-DD')).valueOf();
    let x = toMinutes(this.from - date);
    let y = toMinutes(this.to - date) - x;
    this.pair = cantor(x, y);
};

TimeSlotSchema.methods.createUUID = function() {
    this.uuid = uuid();
};

module.exports = TimeSlotSchema;
