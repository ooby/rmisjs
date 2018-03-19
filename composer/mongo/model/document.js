const mongoose = require('mongoose');
const Schema = mongoose.Schema;
const {
    getUUID,
    setUUID,
    generateUUID
} = require('../uuid');

const DocumentSchema = new Schema({
    Type: {
        type: Buffer,
        get: getUUID,
        set: setUUID,
        required: true
    },
    caseId: {
        type: Number,
        required: true
    },
    PatientSnils: {
        type: String,
        required: true
    },
    ProfessionalSnils: {
        type: String,
        required: true
    },
    CardNumber: {
        type: String,
        required: true
    },
    CaseBegin: {
        type: Date,
        required: true
    },
    CaseEnd: {
        type: Date
    }
});

DocumentSchema.index({
    Type: 1,
    caseId: 1,
    CaseBegin: 1,
    PatientSnils: 1,
    ProfessionalSnils: 1,
}, {
        unique: true
    });

module.exports = mongoose.model('Document', DocumentSchema);
