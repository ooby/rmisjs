const mongoose = require('mongoose');
require('mongoose-uuid2')(mongoose);
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

module.exports = config =>
    new Promise((resolve, reject) =>
        mongoose.connect(createConnectionString(config), config.mongoose.options)
        .then(() => resolve(mongoose))
        .catch(e => reject(e))
    );
