const { createClient } = require('./client');
const composeLib = async (cfg, opt, lib) => {
    try {
        let client = await createClient(cfg, opt);
        return lib(client);
    } catch (e) { console.error(e); return e; }
};
module.exports = config => {
    let svc = config.rmis;
    return {
        appointment: () => composeLib(svc, 'appointment', require('./libs/appointment')),
        department: () => composeLib(svc, 'department', require('./libs/department')),
        employee: () => composeLib(svc, 'employee', require('./libs/employee')),
        individual: () => composeLib(svc, 'individual', require('./libs/individual')),
        refbook: () => composeLib(svc, 'refbook', require('./libs/refbook')),
        resource: () => composeLib(svc, 'resource', require('./libs/resource')),
        room: () => composeLib(svc, 'room', require('./libs/room'))
    };
};
