const mongoose = require('mongoose');
mongoose.Promise = Promise;

const createConnectionString = config => {
    let opts = config.mongoose;
    let result = 'mongodb://';
    if ('username' in opts && 'password' in opts) {
        result += `${opts.username}:${opts.password}@`;
    }
    result += opts.host;
    if ('port' in opts) {
        result += ':' + opts.port;
    }
    result += '/';
    if ('db' in opts) {
        result += opts.db;
    }
    return result;
};

module.exports = async (config, cb) => {
    try {
        await mongoose.connect(createConnectionString(config), config.mongoose.options);
        return await cb();
    } catch (e) {
        console.error(e);
    } finally {
        await mongoose.disconnect();
    }
};
