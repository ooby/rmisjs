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
const Queue = require('../libs/queue');

const q = new Queue(5);

module.exports = s => {
    return {
        address: () => address(s, q),
        appointment: () => appointment(s, q),
        department: () => department(s, q),
        district: () => district(s, q),
        employee: () => employee(s, q),
        individual: () => individual(s, q),
        patient: () => patient(s, q),
        refbook: () => refbook(s, q),
        resource: () => resource(s, q),
        services: () => services(s, q),
        room: () => room(s, q)
    };
};
