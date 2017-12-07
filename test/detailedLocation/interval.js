const stringSchema = require('./string');

module.exports = {
    type: 'object',
    requied: ['date', 'timePeriod'],
    properties: {
        date: {
            type: 'string',
            format: 'date'
        },
        timePeriod: {
            type: 'array',
            items: {
                type: 'object',
                required: ['from', 'to', 'uuid', 'status'],
                properties: {
                    from: {
                        type: 'string',
                        format: 'time'
                    },
                    to: {
                        type: 'string',
                        format: 'time'
                    },
                    uuid: {
                        type: 'string',
                        format: 'uuid'
                    },
                    status: {
                        type: 'integer'
                    }
                }
            }
        }
    }
};
