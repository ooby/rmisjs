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

const createConnectionString = ({ mongoose }) => {
    let result = 'mongodb://';
    if (objectProperties(mongoose, 'username', 'password')) {
        let { username, password } = mongoose;
        result += `${username}:${password}@`;
    }
    let { host, db } = mongoose;
    result += `${host}`;
    if (objectProperties(mongoose, 'port')) {
        result += `:${mongoose.port}`;
    }
    return result + `/${db}`;
};

module.exports = config => {
    mongoose.connect(createConnectionString(config), config.mongoose.options);
    return mongoose;
};
