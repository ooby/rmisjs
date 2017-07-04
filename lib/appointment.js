module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getTimes: function (d, cb) {
            c.getTimes(d, function (e, r) { cb(e, r); });
        }
    };
};