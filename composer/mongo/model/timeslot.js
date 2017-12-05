const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const Schema = mongoose.Schema;

const TimeSlotSchema = new Schema({
    _id: {
        type: String,
        default: uuid
    },
    from: {
        type: Date,
        required: true
    },
    to: {
        type: Date,
        required: true
    },
    location: {
        type: Number,
        required: true
    },
    date: {
        type: Date,
        required: true
    },
    unavailable: {
        type: [String],
        default: [],
    },
    services: {
        type: [Number],
        default: [],
    },
    status: {
        type: Number,
        default: 1
    }
});

TimeSlotSchema.index({
    from: 1,
    location: 1
}, {
    unique: true
});

TimeSlotSchema.methods.updateStatus = function(status) {
    return this.update({
        $set: {
            status
        }
    });
};

TimeSlotSchema.statics.getByLocation = function (location, ...args) {
    return this.find({
        location
    }, ...args);
};

TimeSlotSchema.statics.getByUUID = function (_id, ...args) {
    return this.findOne({
        _id
    }, ...args);
};

TimeSlotSchema.set('toObject', { getters: true });
TimeSlotSchema.set('toJSON', { getters: true });

TimeSlotSchema.statics.timeTableWithDuration = function(...sources) {
    return (
        this.aggregate()
        .match({
            unavailable: {
                $nin: sources
            }
        })
        .group({
            _id: {
                date: '$date',
                location: '$location'
            },
            from: { $min: '$from' },
            to: { $max: '$to' }
        })
        .lookup({
            from: 'locations',
            localField: '_id.location',
            foreignField: '_id',
            as: 'location'
        })
        .unwind('location')
        .match({
            'location.source': {
                $in: sources
            }
        })
        .project({
            _id: '$_id.location',
            date: '$_id.date',
            room: {
                $arrayElemAt: ['$location.rooms', 0]
            },
            position: {
                $arrayElemAt: ['$location.positions', 0]
            },
            department: '$location.department',
            from: '$from',
            to: '$to'
        })
        .lookup({
            from: 'rooms',
            localField: 'room',
            foreignField: '_id',
            as: 'room'
        })
        .lookup({
            from: 'employees',
            localField: 'position',
            foreignField: 'position',
            as: 'employee'
        })
        .lookup({
            from: 'departments',
            localField: 'department',
            foreignField: '_id',
            as: 'department'
        })
        .unwind('room')
        .unwind('employee')
        .unwind('department')
        .group({
            _id: '$date',
            location: {
                $push: '$$ROOT'
            }
        })
        .project({
            _id: false,
            date: '$_id',
            location: '$location'
        })
        .project({
            'location.date': false,
            'location.position': false
        })
    );
};

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
