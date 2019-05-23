const mongoose = require('mongoose')
const { Schema } = mongoose

const OrganizationSchema = new Schema({
  rmisID: String,
  muCode: String,
  ogrn: String,
  name: String
})

module.exports = mongoose.model('Organization', OrganizationSchema)
