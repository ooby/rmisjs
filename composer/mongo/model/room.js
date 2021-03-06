const mongoose = require('mongoose')
const Schema = mongoose.Schema

const RoomSchema = new Schema({
  _id: Number,
  department: {
    type: Number,
    required: true
  },
  parentRoom: Number,
  name: {
    type: String,
    required: true
  },
  code: {
    type: String,
    required: true
  }
})

RoomSchema.statics.getbyId = function(_id, ...args) {
  return this.findOne(
    {
      _id
    },
    ...args
  )
}

module.exports = mongoose.model('Room', RoomSchema)
