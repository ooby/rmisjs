const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'department');
    return {
        describe: () => c.describe(),
        getDepartment: d => c.getDepartmentAsync(d),
        getDepartments: d => c.getDepartmentsAsync(d)
    };
};
