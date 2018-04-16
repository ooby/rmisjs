const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'employee');
    return {
        describe: () => c.describe(),
        getEmployee: d => wrap(q, () => c.getEmployeeAsync(d)),
        getEmployees: d => wrap(q, () => c.getEmployeesAsync(d)),
        getEmployeePosition: d => wrap(q, () => c.getEmployeePositionAsync(d)),
        getEmployeePositions: d => wrap(q, () => c.getEmployeePositionsAsync(d)),
        getEmployeeSpecialities: d => wrap(q, () => c.getEmployeeSpecialitiesAsync(d)),
        getPosition: d => wrap(q, () => c.getPositionAsync(d))
    };
};
