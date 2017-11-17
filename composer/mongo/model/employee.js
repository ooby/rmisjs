const mongoose = require('mongoose');
const { Schema } = mongoose;

const EmployeeSchema = new Schema({
    rmisId: { type: Number, unique: true, required: true },
    position: { type: Number, required: true, unique: true },
    positionName: String,
    speciality: Number,
    snils: String,
    surname: String,
    patrName: String,
    firstName: String,
    birthDate: Date,
    individual: { type: String, unique: true, required: true }
});

module.exports = EmployeeSchema;
