const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const LastSyncSchema = new Schema({
    date: {
        type: Date,
        required: true,
        unique: true
    }
});

module.exports = mongoose.model('LastSync', LastSyncSchema);
