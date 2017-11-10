const mongoose = require('mongoose');
const uuid = require('uuid');
const { Schema } = mongoose;
require('mongoose-uuid2')(mongoose);
mongoose.Promise = Promise;

const TimeSlotSchema = new Schema({
    from: Date,
    to: Date,
    pair: String,
    location: { type: Number, required: true },
    reserved: { type: Boolean, default: false, required: true },
    uuid: { type: mongoose.Types.UUID, default: uuid.v4 }
});

TimeSlotSchema.statics.getByLocation = function(location, ...args) {
    return this.find({ location }, ...args);
};

TimeSlotSchema.statics.getByUUID = function(uuid, ...args) {
    return this.findOne({ uuid }, ...args);
};

module.exports = TimeSlotSchema;
