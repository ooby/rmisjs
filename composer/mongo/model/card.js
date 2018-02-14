const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const CardSchema = new Schema({
    _id: false,
    shelf: {
        type: Number,
        required: true
    },
    num: {
        type: Number,
        required: true
    },
    surname: {
        type: String,
        required: true
    },
    firstName: {
        type: String,
        required: true
    },
    patrName: {
        type: String,
        required: true
    },
    birth: {
        type: Date,
        required: true
    },
    address: String,
    death: Date
});

CardSchema.methods.fio = function() {
    return [this.surname, this.firstName, this.patrName].join(' ');
};

CardSchema.statics.getByNum = function(shelf, num) {
    return this.findOne({
        shelf,
        num
    }).exec();
};

CardSchema.index({
    shelf: true,
    num: true
}, {
    unique: true
});

module.exports = mongoose.model('Card', CardSchema);
