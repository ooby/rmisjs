module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getLocation: function (d, cb) {
            c.getLocation(d, function (e, r) { cb(e, r); });
        },
        getLocations: function (d, cb) {
            c.getLocations(d, function (e, r) { cb(e, r); });
        }
    };
};