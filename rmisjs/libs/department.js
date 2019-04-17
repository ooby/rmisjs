const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'department'));
    return {
        describe: () => c.describe(),
        getDepartment: d => wrap(q, () => c.getDepartmentAsync(d)),
        getDepartments: d => wrap(q, () => c.getDepartmentsAsync(d))
    };
};
