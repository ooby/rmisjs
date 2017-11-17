const connect = require('../connect');

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateEmployees = require('./employees');
const updateTimeSlots = require('./timeslots');

const rmisjs = require('../../../index');

module.exports = async (config, m) => {
    const { clinicId } = config.rmis;
    const { rmis, composer } = rmisjs(config);
    const mongoose = connect(config);
    await updateDepartments(composer);
    await updateLocations(rmis, clinicId);
    await updateRooms(rmis);
    await updateEmployees(rmis);
    await updateTimeSlots(rmis);
    mongoose.disconnect();
};
