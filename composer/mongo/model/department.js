const mongoose = require('mongoose');
const { Schema } = mongoose;

const DepartmentSchema = new Schema({
    rmisId: { type: Number, unique: true },
    name: String
});

DepartmentSchema.statics.getById = function (rmisId, ...args) {
    return this.findOne({ rmisId }, ...args);
};

module.exports = DepartmentSchema;
