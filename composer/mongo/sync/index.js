const connect = require('../connect');

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateEmployees = require('./employees');
const updateTimeSlots = require('./timeslots');

const rmisjs = require('../../../index');

module.exports = async(config, m) => {
    let mongoose;
    try {
        const clinicId = config.rmis.clinicId;
        const {
            rmis,
            composer
        } = rmisjs(config);
        mongoose = await connect(config);
        await updateDepartments(composer);
        await updateLocations(rmis, clinicId);
        await Promise.all([
            updateRooms(rmis),
            updateEmployees(rmis),
            updateTimeSlots(rmis, clinicId)
        ]);
    } finally {
        if (mongoose) await mongoose.disconnect();
    }
};
