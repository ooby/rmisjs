const mongoose = require('mongoose')
const Schema = mongoose.Schema

const DocumentSchema = new Schema({
  Type: {
    type: String,
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
  },
  UploadDate: Date,
  ErrorText: String
})

DocumentSchema.index(
  {
    Type: 1,
    caseId: 1,
    CaseBegin: 1,
    PatientSnils: 1,
    ProfessionalSnils: 1
  },
  { unique: true }
)

module.exports = mongoose.model('Document', DocumentSchema)
