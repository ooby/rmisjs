const createClient = require('./client');

module.exports = s => {
    return {
        process: () => require('./libs/mu')(s)
    };
};
