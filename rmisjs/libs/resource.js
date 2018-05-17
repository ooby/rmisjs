const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await createClient(s, 'resource');
    return {
        describe: () => c.describe(),
        getLocation: d => wrap(q, () => c.getLocationAsync(d)),
        getLocations: d => wrap(q, () => c.getLocationsAsync(d))
    };
};
