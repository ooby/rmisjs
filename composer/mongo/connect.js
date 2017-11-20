const mongoose = require('mongoose');
mongoose.Promise = Promise;

const objectProperties = (obj, ...props) => {
    for (let prop of props) {
        if (prop in obj === false) {
            return false;
        }
    }
    return true;
};

const createConnectionString = config => {
    let result = 'mongodb://';
    if (objectProperties(mongoose, 'username', 'password')) {
        result += `${config.mongoose.username}:${config.mongoose.password}@`;
    }
    result += config.mongoose.host;
    if (objectProperties(config.mongoose, 'port')) {
        result += ':' + config.mongoose.port;
    }
    return result + '/' + config.mongoose.db;
};

module.exports = config => {
    mongoose.connect(createConnectionString(config), config.mongoose.options);
    return mongoose;
};