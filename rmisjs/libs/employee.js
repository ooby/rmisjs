const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s, 'employee');
    return {
        describe: () => c.describe(),
        getEmployee: d => q.push(() => c.getEmployeeAsync(d)),
        getEmployees: d => q.push(() => c.getEmployeesAsync(d)),
        getEmployeePosition: d => q.push(() => c.getEmployeePositionAsync(d)),
        getEmployeePositions: d => q.push(() => c.getEmployeePositionsAsync(d)),
        getEmployeeSpecialities: d => q.push(() => c.getEmployeeSpecialitiesAsync(d)),
        getPosition: d => q.push(() => c.getPositionAsync(d))
    };
};
