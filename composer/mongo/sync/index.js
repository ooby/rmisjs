const connect = require('../connect');

const updateDepartments = require('./departments');
const updateLocations = require('./locations');
const updateRooms = require('./rooms');
const updateEmployees = require('./employees');
const updateTimeSlots = require('./timeslots');
const updateServices = require('./services');

const rmisjs = require('../../../index');

/**
 * Выгрузка данных из РМИС в MongoDB
 * @param {Object} s - Конфигурация
 * @return {Promise<Error>}
 */
module.exports = async s => {
    try {
        await connect(s, async () => {
            await updateDepartments(s);
            await updateLocations(s);
            await Promise.all([
                updateRooms(s),
                updateServices(s),
                updateEmployees(s),
                updateTimeSlots(s)
            ]);
        });
    } catch (e) {
        console.error(e);
        return e;
    }
};
