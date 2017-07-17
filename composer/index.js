const { getLocationsWithPortal } = require('./resource.js');
module.exports = s => {
    return {
        getLocationsWithPortal: () => getLocationsWithPortal(s)
    };
};