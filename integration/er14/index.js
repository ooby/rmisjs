const createClient = require('./client');

const mu = require('./libs/mu');

module.exports = s => {
    return {
        process: () => mu(s)
    };
};
