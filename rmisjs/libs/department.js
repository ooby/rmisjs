const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s, 'department');
    return {
        describe: () => c.describe(),
        getDepartment: d => q.push(() => c.getDepartmentAsync(d)),
        getDepartments: d => q.push(() => c.getDepartmentsAsync(d))
    };
};
