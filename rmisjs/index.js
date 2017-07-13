const soap = require('soap');
const { url } = require('../libs/url');

const createClient = (cfg, opt) => {
    return new Promise((resolve, reject) => {
        soap.createClient(url(cfg, opt)[0], (e, c) => {
            if (e) { reject(e); }
            else {
                c.setSecurity(new soap.BasicAuthSecurity(cfg.auth.username, cfg.auth.password));
                resolve(c);
            }
        });
    });
};

const composeLib = async (cfg, opt, lib) => {
    let client;
    await createClient(cfg, opt)
        .then(c => { client = c; })
        .catch(e => { throw e; });
    return lib(client);
};

module.exports = config => {
    let svc = config.rmis;
    return {
        appointment: () => composeLib(svc, 'appointment', require('./appointment')),
        department: () => composeLib(svc, 'department', require('./department')),
        employee: () => composeLib(svc, 'employee', require('./employee')),
        individual: () => composeLib(svc, 'individual', require('./individual')),
        resource: () => composeLib(svc, 'resource', require('./resource')),
        room: () => composeLib(svc, 'room', require('./room')),
    };
};