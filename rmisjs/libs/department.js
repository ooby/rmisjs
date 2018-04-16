const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'department');
    return {
        describe: () => c.describe(),
        getDepartment: d => wrap(q, () => c.getDepartmentAsync(d)),
        getDepartments: d => wrap(q, () => c.getDepartmentsAsync(d))
    };
};
