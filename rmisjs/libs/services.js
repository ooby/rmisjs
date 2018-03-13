const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(2);

module.exports = async s => {
    let c = await createClient(s, 'services');
    return {
        describe: () => c.describe(),
        getService: d => q.push(() => c.getServiceAsync(d)),
        getServices: d => q.push(() => c.getServicesAsync(d))
    };
};
