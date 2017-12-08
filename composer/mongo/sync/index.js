const connect = require('../connect');

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateEmployees = require('./employees');
const updateTimeSlots = require('./timeslots');

const rmisjs = require('../../../index');

module.exports = async(config, m) => {
    try {
        const clinicId = config.rmis.clinicId;
        const {
            rmis,
            composer
        } = rmisjs(config);
        await connect(config, async () => {
            await updateDepartments(composer);
            await updateLocations(rmis, clinicId);
            await updateRooms(rmis);
            await updateEmployees(rmis);
            await updateTimeSlots(rmis, clinicId);
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};
