const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
    shelf: {
        type: Number,
        required: true
    },
    num: {
        type: Number,
        required: true
    },
    decade: {
        type: Number,
        required: true
    },
    name: {
        type: String,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    patronymic: String,
    address: {
        type: String,
        required: true
    },
    birth: {
        type: Date,
        required: true
    },
    death: Date
});

module.exports = mongoose.model('Card', CardSchema);
