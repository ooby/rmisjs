const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'resource');
    return {
        describe: () => c.describe(),
        getLocation: d => c.getLocationAsync(d),
        getLocations: d => c.getLocationsAsync(d)
    };
};
