const connector = require('./connector');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateTimeSlots = require('./timeslots');

const rmisjs = require('../../../index');

module.exports = async (config) => {
    try {
        const { clinicId } = config.rmis;
        const { rmis, composer } = rmisjs(config);
        const roomService = await rmis.room();
        const resourceService = await rmis.resource();
        const appointmentService = await rmis.appointment();
        mongoose.connect(connector(config), config.mongoose.options);
        await updateDepartments(composer);
        await updateRooms(roomService, clinicId);
        await updateLocations(resourceService, clinicId);
        await updateTimeSlots(appointmentService);
        mongoose.disconnect();
    } catch (e) {
        return e;
    }
};
