const mongoose = require('mongoose');
const Schema = mongoose.Schema;

const DepartmentSchema = new Schema({
    _id: Number,
    code: {
        type: Number,
        required: true
    },
    name: String,
    type: {
        type: Number,
        required: true
    }
});

DepartmentSchema.statics.getById = function (rmisId, ...args) {
    return this.findOne({
        rmisId
    }, ...args);
};

module.exports = mongoose.model('Department', DepartmentSchema);
