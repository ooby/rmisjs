const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    rmisId: {
        type: Number,
        unique: true,
        required: true
    },
    department: {
        type: Number,
        required: true
    },
    source: {
        type: [String],
        default: []
    },
    positions: {
        type: [Number],
        default: []
    },
    rooms: {
        type: [Number],
        default: []
    }
});

const timeTableWithSlots = (pipeline, keepSensetive = false) => {
    pipeline = (
        pipeline
        .lookup({
            from: 'timeslots',
            localField: 'rmisId',
            foreignField: 'location',
            as: 'times'
        })
        .match({
            'times.0': {
                $exists: true
            }
        })
        .project({
            rmisId: '$rmisId',
            department: '$department',
            room: {
                $arrayElemAt: ['$rooms', 0]
            },
            position: {
                $arrayElemAt: ['$positions', 0]
            },
            source: '$source',
            times: '$times'
        })
        .lookup({
            from: 'departments',
            localField: 'department',
            foreignField: 'rmisId',
            as: 'department'
        })
        .lookup({
            from: 'rooms',
            localField: 'room',
            foreignField: 'rmisId',
            as: 'room'
        })
        .lookup({
            from: 'employees',
            localField: 'position',
            foreignField: 'position',
            as: 'employee'
        })
        .unwind('department')
        .unwind('room')
        .unwind('employee')
    );
    if (!keepSensetive) {
        pipeline = pipeline.project({
            'employee.birthDate': false,
            'employee.snils': false,
            'employee.individual': false
        });
    }
    return pipeline;
};

const timeTableWithDuration = (pipeline, keepSensetive) => (
    timeTableWithSlots(pipeline, keepSensetive)
    .unwind('times')
    .group({
        _id: {
            rmisId: '$rmisId',
            date: '$times.date'
        },
        location: {
            $first: '$$ROOT'
        },
        interval: {
            $push: '$times'
        }
    })
    .group({
        _id: '$_id.rmisId',
        location: {
            $first: '$location'
        },
        interval: {
            $push: {
                date: '$_id.date',
                timePeriod: '$interval'
            }
        }
    })
    .project({
        '_id': false,
        'location.times': false
    })
);

LocationSchema.statics.timeTableWithSlots = function (department) {
    return (
        timeTableWithSlots(
            this.aggregate()
            .match({
                department
            })
        )
        .project({
            '_id': false,
            '__v': false,
            'position': false,
            'department._id': false,
            'department.__v': false,
            'room._id': false,
            'room.__v': false,
            'room.department': false,
            'employee._id': false,
            'employee.__v': false,
            'times.__v': false,
            'times.pair': false,
            'times.location': false
        })
    );
};

LocationSchema.statics.timeTableWithDuration = async function (department) {
    return (
        timeTableWithDuration(
            this.aggregate()
            .match({
                department
            })
        )
        .project({
            '_id': false,
            'location._id': false,
            'location.__v': false,
            'location.times': false,
            'location.position': false,
            'location.department._id': false,
            'location.department.__v': false,
            'location.room._id': false,
            'location.room.__v': false,
            'location.employee._id': false,
            'location.employee.__v': false,
            'interval.timePeriod.__v': false,
            'interval.timePeriod.location': false
        })
    );
};

LocationSchema.statics.getById = function (rmisId, ...args) {
    return this.findOne({
        rmisId
    }, ...args);
};

LocationSchema.statics.getDetailedLocationsBySource = function (...sources) {
    let pre = this.aggregate().match({
        source: {
            $in: sources
        }
    });
    return (
        timeTableWithDuration(pre, true)
        .project({
            id: '$location.employee.rmisId',
            room: '$location.room.code',
            snils: '$location.employee.snils',
            surname: '$location.employee.surname',
            firstName: '$location.employee.firstName',
            patrName: '$location.employee.patrName',
            location: '$location.rmisId',
            position: '$location.employee.position',
            interval: '$interval',
            birthDate: '$birthDate',
            individual: '$location.employee.individual',
            speciality: '$location.employee.speciality',
            positionName: '$location.employee.positionName',
            department: {
                code: '$location.department.code',
                name: '$location.department.name',
                type: '$location.department.type'
            },
            fio: {
                $concat: [
                    '$location.employee.surname', ' ',
                    '$location.employee.firstName', ' ',
                    '$location.employee.patrName'
                ]
            },
            name: {
                $concat: [
                    '$location.employee.positionName', ' ',
                    '$location.employee.surname', ' ',
                    '$location.employee.firstName', ' ',
                    '$location.employee.patrName'
                ]
            }
        })
    );
};

module.exports = mongoose.model('Location', LocationSchema);
