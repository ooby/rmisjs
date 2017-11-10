const mongoose = require('mongoose');

const transform = schemas => {
    for (let name of Object.keys(schemas)) {
        schemas[name] = mongoose.model(name, schemas[name]);
    }
    return schemas;
};

const schemas = {
    Department: require('./department'),
    Location: require('./location'),
    TimeSlot: require('./timeslot'),
    Room: require('./room')
};

module.exports = transform(schemas);
