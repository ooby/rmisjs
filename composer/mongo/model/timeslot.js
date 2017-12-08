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

TimeSlotSchema.methods.updateStatus = function (status) {
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

const getAvailableSlots = (model, ...sources) =>
    model
    .aggregate()
    .match({
        'unavailable': {
            $nin: sources
        },
        'services.0': {
            $exists: true
        }
    });

TimeSlotSchema.statics.getDetailedLocationsBySource = function (...sources) {
    return (
        getAvailableSlots(this, ...sources)
        .group({
            _id: {
                date: '$date',
                location: '$location'
            },
            interval: {
                $push: {
                    uuid: '$_id',
                    from: '$from',
                    to: '$to',
                    status: '$status'
                }
            }
        })
        .group({
            _id: '$_id.location',
            interval: {
                $push: {
                    date: '$_id.date',
                    timePeriod: '$interval'
                }
            }
        })
        .lookup({
            from: 'locations',
            localField: '_id',
            foreignField: '_id',
            as: 'location'
        })
        .match({
            'location.source': {
                $in: sources
            }
        })
        .unwind('location')
        .project({
            interval: true,
            room: {
                $arrayElemAt: ['$location.rooms', 0]
            },
            position: {
                $arrayElemAt: ['$location.positions', 0]
            },
            department: '$location.department'
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
        .unwind('employee')
        .unwind('room')
        .unwind('department')
        .project({
            id: '$employee._id',
            room: '$room.code',
            snils: '$employee.snils',
            surname: '$employee.surname',
            firstName: '$employee.firstName',
            patrName: '$employee.patrName',
            location: '$_id',
            position: '$employee.position',
            interval: '$interval',
            birthDate: '$employee.birthDate',
            individual: '$employee.individual',
            speciality: '$employee.speciality',
            positionName: '$employee.positionName',
            department: '$department',
            fio: {
                $concat: [
                    '$employee.surname', ' ',
                    '$employee.firstName', ' ',
                    '$employee.patrName'
                ]
            },
            name: {
                $concat: [
                    '$employee.positionName', ' ',
                    '$employee.surname', ' ',
                    '$employee.firstName', ' ',
                    '$employee.patrName'
                ]
            }
        })
        .project({
            '_id': false,
            'department.__v': false,
            'department._id': false
        })
    );
};

TimeSlotSchema.statics.timeTableWithSlots = function (department, ...sources) {
    return (
        getAvailableSlots(this, ...sources)
        .group({
            _id: '$location',
            times: {
                $push: '$$ROOT'
            }
        })
        .lookup({
            from: 'locations',
            localField: '_id',
            foreignField: '_id',
            as: 'location'
        })
        .match({
            'location.department': department,
            'location.source': {
                $in: sources
            }
        })
        .unwind('location')
        .project({
            _id: '$_id',
            room: {
                $arrayElemAt: ['$location.rooms', 0]
            },
            position: {
                $arrayElemAt: ['$location.positions', 0]
            },
            department: '$location.department',
            source: '$location.source',
            times: true
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
        .project({
            'times.location': false,
            'times.__v': false,
            'room.__v': false,
            'employee.__v': false,
            'position': false,
            'room.department': false,
            'department.__v': false
        })
        .project({
            'employee.snils': false,
            'individual': false
        })
    );
};

TimeSlotSchema.statics.timeTableWithDuration = function (department, ...sources) {
    return (
        getAvailableSlots(this, ...sources)
        .group({
            _id: {
                date: '$date',
                location: '$location'
            },
            from: {
                $min: '$from'
            },
            to: {
                $max: '$to'
            }
        })
        .lookup({
            from: 'locations',
            localField: '_id.location',
            foreignField: '_id',
            as: 'location'
        })
        .unwind('location')
        .match({
            'location.department': department,
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
