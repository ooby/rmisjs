const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    _id: Number,
    department: {
        type: Number,
        required: true
    },
    source: {
        type: [String],
        default: []
    },
    positions: {
        type: [Number],
        default: []
    },
    rooms: {
        type: [Number],
        default: []
    }
});

LocationSchema.statics.getById = function (_id, ...args) {
    return this.findOne({
        _id
    }, ...args);
};

module.exports = mongoose.model('Location', LocationSchema);
