const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const Schema = mongoose.Schema;
require('mongoose-uuid2')(mongoose);

const toMinutes = a => Math.floor(a / 60000);
const cantor = (x, y) => (x + y) * (x + y + 1) * .5 + y;

const TimeSlotSchema = new Schema({
    _id: {
        type: mongoose.Types.UUID,
        default: uuid
    },
    from: {
        type: Date,
        required: true,
    },
    to: {
        type: Date,
        required: true
    },
    pair: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    unavailable: {
        type: [String],
        default: [],
    },
    services: {
        type: [Number],
        default: [],
    },
    location: {
        type: Number,
        required: true
    },
    status: {
        type: Number,
        default: 1
    }
});

TimeSlotSchema.statics.getByLocation = function (location, ...args) {
    return this.find({
        location
    }, ...args);
};

TimeSlotSchema.statics.getByUUID = function (_id, ...args) {
    return this.findOne({
        _id
    }, ...args);
};

TimeSlotSchema.statics.createPair = function (slot) {
    let x = toMinutes(slot.from - new Date(slot.date));
    let y = toMinutes(slot.to - slot.from);
    return slot.pair = cantor(x, y);
};

TimeSlotSchema.methods.createPair = function () {
    return TimeSlotSchema.statics.createPair(this);
};

TimeSlotSchema.set('toObject', { getters: true });
TimeSlotSchema.set('toJSON', { getters: true });

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
