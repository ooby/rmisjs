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
    birth: {
        type: Date,
        required: true
    },
    address: String,
    surname: String,
    name: String,
    patronymic: String,
    death: Date,
    text: String
});

CardSchema.index({
    shelf: 1,
    num: 1,
    decade: 1,
    birth: 1
}, {
        unique: true
    });

CardSchema.index({ '$**': 'text' });

module.exports = mongoose.model('Card', CardSchema);
