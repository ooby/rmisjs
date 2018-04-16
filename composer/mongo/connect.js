const createConnectionString = require('./parseUri');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

module.exports = async (config, cb) => {
    try {
        await mongoose.connect(createConnectionString(config), config.mongo.mongoose.options);
        return await cb();
    } catch (e) {
        console.error(e);
        return e;
    } finally {
        await mongoose.disconnect();
    }
};
