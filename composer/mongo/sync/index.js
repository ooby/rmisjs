const connect = require('../connect');

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateEmployees = require('./employees');
const updateTimeSlots = require('./timeslots');

const rmisjs = require('../../../index');

module.exports = async(config) => {
    try {
        const clinicId = config.rmis.clinicId;
        const {
            rmis,
            composer
        } = rmisjs(config);
        await connect(config, async () => {
            await updateDepartments(composer);
            await updateLocations(rmis, clinicId);
            await Promise.all([
                updateRooms(rmis),
                updateEmployees(rmis),
                updateTimeSlots(rmis, clinicId)
            ]);
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};
