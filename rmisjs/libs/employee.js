const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'employee'));
    return {
        describe: () => c.describe(),
        getEmployee: d => wrap(q, () => c.getEmployeeAsync(d)),
        getEmployees: d => wrap(q, () => c.getEmployeesAsync(d)),
        getEmployeePosition: d => wrap(q, () => c.getEmployeePositionAsync(d)),
        getEmployeePositions: d =>
            wrap(q, () => c.getEmployeePositionsAsync(d)),
        getEmployeeSpecialities: d =>
            wrap(q, () => c.getEmployeeSpecialitiesAsync(d)),
        getPosition: d => wrap(q, () => c.getPositionAsync(d))
    };
};
