const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const EmployeeSchema = new Schema({
    _id: Number,
    position: {
        type: Number,
        required: true,
        unique: true
    },
    positionName: String,
    speciality: Number,
    snils: String,
    surname: String,
    patrName: String,
    firstName: String,
    birthDate: Date,
    individual: {
        type: String,
        unique: true,
        required: true
    }
});

module.exports = mongoose.model('Employee', EmployeeSchema);
