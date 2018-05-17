const createConnectionString = require('./parseUri');
const mongoose = require('mongoose');
mongoose.Promise = Promise;

const connect = s =>
    mongoose.connect(createConnectionString(s), s.mongo.mongoose.options);

const close = () =>
    mongoose.connection.close();

module.exports = { connect, close };
