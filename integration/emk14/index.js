const createClient = require('./client').createClient;

const composeLib = (host, service) => {
    let client = createClient(host, service);
    return require(`./libs/${service}`)(client);
};

module.exports = s => {
    return {
        patient: () => require('./libs/patient')(createClient(s.emk14.host, 'patient')),
        professional: () => require('./libs/professional')(createClient(s.emk14.host, 'professional')),
        document: () => require('./libs/document')(createClient(s.emk14.host, 'document'))
    };
};
