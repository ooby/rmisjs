const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema({
    rmisId: Number,
    code: Number,
    name: String,
    type: Number
});

DepartmentSchema.statics.getById = function (rmisId, ...args) {
    return this.findOne({
        rmisId
    }, ...args);
};

module.exports = DepartmentSchema;
