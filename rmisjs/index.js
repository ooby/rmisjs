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
        address: () => composeLib(svc, 'address', require('./libs/address')),
        appointment: () => composeLib(svc, 'appointment', require('./libs/appointment')),
        department: () => composeLib(svc, 'department', require('./libs/department')),
        district: () => composeLib(svc, 'district', require('./libs/district')),
        employee: () => composeLib(svc, 'employee', require('./libs/employee')),
        individual: () => composeLib(svc, 'individual', require('./libs/individual')),
        patient: () => composeLib(svc, 'patient', require('./libs/patient')),
        refbook: () => composeLib(svc, 'refbook', require('./libs/refbook')),
        resource: () => composeLib(svc, 'resource', require('./libs/resource')),
        room: () => composeLib(svc, 'room', require('./libs/room'))
    };
};
