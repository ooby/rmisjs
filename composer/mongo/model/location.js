const mongoose = require('mongoose');
const moment = require('moment');
const Schema = mongoose.Schema;

const LocationSchema = new Schema({
    _id: Number,
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
            localField: '_id',
            foreignField: 'location',
            as: 'times'
        })
        .match({
            'times.0': {
                $exists: true
            }
        })
        .project({
            _id: '$_id',
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
            foreignField: '_id',
            as: 'department'
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

LocationSchema.statics.timeTableWithSlots = function (department) {
    return (
        timeTableWithSlots(
            this.aggregate()
            .match({
                department
            })
        )
        .project({
            '__v': false,
            'position': false,
            'department.__v': false,
            'room.__v': false,
            'room.department': false,
            'employee.__v': false,
            'times.__v': false,
            'times.location': false
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
        timeTableWithSlots(pre, true)
        .unwind('times')
        .match({
            'times.unavailable': {
                $nin: sources
            },
            'times.services.0': {
                $exists: true
            }
        })
        .group({
            _id: {
                id: '$_id',
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
            _id: '$_id',
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
        .project({
            id: '$location.employee._id',
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
