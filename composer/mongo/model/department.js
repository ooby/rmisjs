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

DepartmentSchema.statics.getById = function (_id, ...args) {
    return this.findOne({
        _id
    }, ...args);
};

module.exports = mongoose.model('Department', DepartmentSchema);
