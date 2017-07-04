function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getTimes: function (d, cb) {
            c.getTimes(d, cbp);
        }
    };
};