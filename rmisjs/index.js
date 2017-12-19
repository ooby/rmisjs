module.exports = s => {
    return {
        address: () => require('./libs/address')(s),
        appointment: () => require('./libs/appointment')(s),
        department: () => require('./libs/department')(s),
        district: () => require('./libs/district')(s),
        employee: () => require('./libs/employee')(s),
        individual: () => require('./libs/individual')(s),
        patient: () => require('./libs/patient')(s),
        refbook: () => require('./libs/refbook')(s),
        resource: () => require('./libs/resource')(s),
        services: () => require('./libs/services')(s),
        room: () => require('./libs/room')(s)
    };
};
