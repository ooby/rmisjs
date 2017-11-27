const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const Schema = mongoose.Schema;
require('mongoose-uuid2')(mongoose);

const TimeSlotSchema = new Schema({
    _id: {
        type: mongoose.Types.UUID,
        default: uuid
    },
    from: {
        type: Date,
        required: true
    },
    to: {
        type: Date,
        required: true
    },
    location: {
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
    status: {
        type: Number,
        default: 1
    }
});

TimeSlotSchema.index({
    from: 1,
    location: 1
}, {
    unique: true
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

TimeSlotSchema.set('toObject', { getters: true });
TimeSlotSchema.set('toJSON', { getters: true });

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
