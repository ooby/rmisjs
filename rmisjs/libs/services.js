const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'services'));
    return {
        describe: () => c.describe(),
        getService: d => wrap(q, () => c.getServiceAsync(d)),
        getServices: d => wrap(q, () => c.getServicesAsync(d))
    };
};
