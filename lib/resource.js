function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getLocation: function (d, cb) {
            c.getLocation(d, cbp);
        },
        getLocations: function (d, cb) {
            c.getLocations(d, cbp);
        }
    };
};