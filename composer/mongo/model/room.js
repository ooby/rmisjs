const mongoose = require('mongoose');
const { Schema } = mongoose;
mongoose.Promise = Promise;

const RoomSchema = new Schema({
    rmisId: { type: Number, unique: true, required: true },
    department: Number,
    parentRoom: Number,
    name: String,
    code: String
});

RoomSchema.statics.getbyId = function (rmisId, ...args) {
    return this.findOne({ rmisId }, ...args);
};

module.exports = RoomSchema;
