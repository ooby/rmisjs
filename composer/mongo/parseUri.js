module.exports = config => {
    let opts = config.mongo.mongoose;
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
