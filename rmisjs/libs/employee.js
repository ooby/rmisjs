const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'employee');
    return {
        describe: () => c.describe(),
        getEmployee: d => c.getEmployeeAsync(d),
        getEmployees: d => c.getEmployeesAsync(d),
        getEmployeePosition: d => c.getEmployeePositionAsync(d),
        getEmployeePositions: d => c.getEmployeePositionsAsync(d),
        getEmployeeSpecialities: d => c.getEmployeeSpecialitiesAsync(d),
        getPosition: d => c.getPositionAsync(d)
    };
};
