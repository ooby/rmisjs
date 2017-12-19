const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'services');
    return {
        describe: () => c.describe(),
        getService: d => c.getServiceAsync(d),
        getServices: d => c.getServicesAsync(d)
    };
};
