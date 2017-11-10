const mongoose = require('mongoose');
const { Schema } = mongoose;

const TimeSlot = require('./timeslot');

const LocationSchema = new Schema({
    rmisId: { type: Number, unique: true, required: true },
    name: String,
    department: Number,
    source: [String],
    rooms: [Number]
});

const timeTableWithSlots = (model, department) =>
    model.aggregate()
    .match({ department })
    .lookup({
        from: 'departments',
        localField: 'department',
        foreignField: 'rmisId',
        as: 'department'
    })
    .unwind('department')
    .unwind('rooms')
    .lookup({
        from: 'rooms',
        localField: 'rooms',
        foreignField: 'rmisId',
        as: 'rooms'
    })
    .lookup({
        from: 'timeslots',
        localField: 'rmisId',
        foreignField: 'location',
        as: 'times'
    });

LocationSchema.statics.timeTableWithSlots = function (department) {
    return (
        timeTableWithSlots(this, department)
        .project({
            '_id': false,
            '__v': false,
            'times._id': false,
            'times.__v': false,
            'rooms._id': false,
            'rooms.__v': false,
            'department._id': false,
            'department.__v': false
        })
    );
};

LocationSchema.statics.timeTableWithDuration = function(department) {
    return (
        timeTableWithSlots(this, department)
        .unwind('times')
        .group({
            _id: {
                date: {
                    $dateToString: { format: '%Y-%m-%d', date: '$times.from' }
                },
                rmisId: '$rmisId'
            },
            rmisId: { $first: '$rmisId' },
            name: { $first: '$name' },
            department: { $first: '$department' },
            rooms: { $first: '$rooms' },
            from: { $min: '$times.from' },
            to: { $max: '$times.to' }
        })
        .group({
            _id: '$_id.date',
            date: { $first: '$_id.date' },
            locations: { $push: '$$ROOT' }
        })
        .sort({ date: 1 })
        .project({
            '_id': false,
            '__v': false,
            'locations._id': false,
            'locations.__v': false,
            'locations.times._id': false,
            'locations.times.__v': false,
            'locations.rooms._id': false,
            'locations.rooms.__v': false,
            'locations.department._id': false,
            'locations.department.__v': false
        })
    );
};

LocationSchema.statics.getById = function(rmisId, ...args) {
    return this.findOne({ rmisId }, ...args);
};

LocationSchema.statics.getBySource = function(sources, ...args) {
    return this.find({ source: { $in: sources } });
}

module.exports = LocationSchema;
