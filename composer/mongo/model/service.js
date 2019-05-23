const mongoose = require('mongoose')
const Schema = mongoose.Schema

const ServiceSchema = new Schema({
  _id: Number,
  code: Number,
  repeated: Boolean,
  name: {
    type: String,
    required: true
  }
})

module.exports = mongoose.model('Service', ServiceSchema)
