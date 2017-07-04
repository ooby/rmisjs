module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getRoom: function (d, cb) {
            c.getRoom(d, function (e, r) { cb(e, r); });
        },
        getRooms: function (d, cb) {
            c.getRooms(d, function (e, r) { cb(e, r); });
        }
    };
};