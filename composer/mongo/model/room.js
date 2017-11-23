const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const RoomSchema = new Schema({
    rmisId: {
        type: Number,
        unique: true,
        required: true
    },
    department: {
        type: Number,
        required: true
    },
    parentRoom: Number,
    name: {
        type: String,
        required: true
    },
    code: {
        type: String,
        required: true
    }
});

RoomSchema.statics.getbyId = function (rmisId, ...args) {
    return this.findOne({
        rmisId
    }, ...args);
};

module.exports = mongoose.model('Room', RoomSchema);