const mongoose = require('mongoose')
const Schema = mongoose.Schema

const EmployeeSchema = new Schema({
  _id: Number,
  position: {
    type: Number,
    required: true
  },
  positionName: {
    type: String,
    required: true
  },
  speciality: {
    type: Number,
    required: true
  },
  specialityName: {
    type: String,
    required: true
  },
  snils: {
    type: String,
    required: true
  },
  surname: {
    type: String,
    required: true
  },
  patrName: {
    type: String,
    required: true
  },
  firstName: {
    type: String,
    required: true
  },
  birthDate: Date,
  individual: {
    type: String,
    required: true
  }
})

EmployeeSchema.index(
  {
    individual: 1,
    position: 1
  },
  {
    unique: true
  }
)

EmployeeSchema.static.getById = function(_id, ...args) {
  return this.findOne(
    {
      _id
    },
    ...args
  )
}

module.exports = mongoose.model('Employee', EmployeeSchema)
