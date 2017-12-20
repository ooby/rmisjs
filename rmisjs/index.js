const address = require('./libs/address');
const appointment = require('./libs/appointment');
const department = require('./libs/department');
const district = require('./libs/district');
const employee = require('./libs/employee');
const individual = require('./libs/individual');
const patient = require('./libs/patient');
const refbook = require('./libs/refbook');
const resource = require('./libs/resource');
const services = require('./libs/services');
const room = require('./libs/room');

module.exports = s => {
    return {
        address: () => address(s),
        appointment: () => appointment(s),
        department: () => department(s),
        district: () => district(s),
        employee: () => employee(s),
        individual: () => individual(s),
        patient: () => patient(s),
        refbook: () => refbook(s),
        resource: () => resource(s),
        services: () => services(s),
        room: () => room(s)
    };
};
