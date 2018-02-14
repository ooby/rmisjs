const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'resource');
    return {
        describe: () => c.describe(),
        getLocation: d => q.push(() => c.getLocationAsync(d)),
        getLocations: d => q.push(() => c.getLocationsAsync(d))
    };
};
