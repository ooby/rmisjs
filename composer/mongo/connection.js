const mongoose = require('mongoose');
mongoose.Promise = Promise;

module.exports = {
    open: s => mongoose.connect(s.mongo.host, s.mongo.options),
    close: () => mongoose.connection.close()
};
