const mongoose = require('mongoose');
const uuid = require('uuid/v4');
const Schema = mongoose.Schema;

function setUUID(v) {
    if (typeof v === 'string') {
        v = Buffer.from(v.replace(/-/g, ''), 'hex');
    }
    if (v instanceof Buffer) {
        v = new mongoose.Types.Buffer(v).toObject(0x04);
    }
    return v;
}

function getUUID(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Buffer) return uuid({
        random: v
    });
}

const TimeSlotSchema = new Schema({
    _id: {
        type: Buffer,
        get: getUUID,
        set: setUUID,
        default: () => setUUID(uuid(null, new Buffer(16), 0))
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

TimeSlotSchema.statics.getUUID = getUUID;
TimeSlotSchema.statics.setUUID = setUUID;

TimeSlotSchema.statics.getByLocation = function (location, ...args) {
    return this.find({
        location
    }, ...args);
};

TimeSlotSchema.statics.getByUUID = function (_id, ...args) {
    return this.findOne({
        _id: setUUID(_id)
    }, ...args);
};

const getAvailableSlots = (model, ...sources) =>
    model.aggregate()
    .match({
        'unavailable': {
            $nin: sources
        },
        'services.0': {
            $exists: true
        }
    });

const binaryToUUID = binary =>
    uuid({
        random: binary.buffer
    });

TimeSlotSchema.statics.getDetailedLocationsBySource = async function (...sources) {
    let data = await (
        getAvailableSlots(this, ...sources)
        .lookup({
            from: 'services',
            localField: 'services',
            foreignField: '_id',
            as: 'services'
        })
        .match({
            services: {
                $elemMatch: {
                    repeated: false
                }
            }
        })
        .group({
            _id: {
                date: '$date',
                location: '$location'
            },
            interval: {
                $push: {
                    _id: '$_id',
                    from: '$from',
                    to: '$to',
                    status: '$status',
                    services: '$services'
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
            specialityName: '$employee.specialityName',
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
        .exec()
    );
    for (let location of data) {
        for (let interval of location.interval) {
            for (let period of interval.timePeriod) {
                period._id = binaryToUUID(period._id);
            }
        }
    }
    return data;
};

TimeSlotSchema.statics.timeTableWithSlots = async function (department, ...sources) {
    let data = await (
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
            'employee.individual': false
        })
        .exec()
    );
    for (let location of data) {
        for (let slot of location.times) {
            slot._id = binaryToUUID(slot._id);
        }
    }
    return data;
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
            'location.position': false,
            'employee.snils': false,
            'employee.individual': false
        })
        .exec()
    );
};

module.exports = mongoose.model('TimeSlot', TimeSlotSchema);
