const mongoose = require('mongoose');

const transform = schemas => {
    for (let key of Object.keys(schemas)) {
        schemas[key] = mongoose.model(key, schemas[key]);
    }
    return schemas;
};

module.exports = transform({
    Department: require('./department'),
    Location: require('./location'),
    TimeSlot: require('./timeslot'),
    Employee: require('./employee'),
    Room: require('./room')
});
