const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'services');
    return {
        describe: () => c.describe(),
        getService: d => wrap(q, () => c.getServiceAsync(d)),
        getServices: d => wrap(q, () => c.getServicesAsync(d))
    };
};
