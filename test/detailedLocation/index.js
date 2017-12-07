const stringSchema = require('./string');
const intervalSchema = require('./interval');

const individualTest = /^[A-Z\d]+$/.source.toString();
const snilsTest = /^\d{11}$/.source.toString();

module.exports = {
    type: 'object',
    requied: ['name', 'location', 'positionName', 'individual', 'id', 'surname', 'patrName', 'firstName', 'speciality', 'fio', 'snils', 'room', 'position', 'interval'],
    properties: {
        name: stringSchema(),
        location: {
            type: 'integer'
        },
        positionName: stringSchema(),
        individual: stringSchema(individualTest),
        id: {
            type: 'integer'
        },
        surname: stringSchema(),
        patrName: stringSchema(),
        firstName: stringSchema(),
        firstName: stringSchema(),
        speciality: {
            type: 'integer'
        },
        fio: stringSchema(),
        snils: stringSchema(snilsTest),
        room: {
            type: 'string'
        },
        position: {
            type: 'integer'
        },
        birthDate: {
            type: 'string',
            format: 'date-time'
        },
        interval: {
            type: 'array',
            items: intervalSchema
        }
    }
};
