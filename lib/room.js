function cbp(e, r) { cb(e, r); }
module.exports = function (c) {
    return {
        describe: function (cb) {
            cb(null, c.describe());
        },
        getRoom: function (d, cb) {
            c.getRoom(d, cbp);
        },
        getRooms: function (d, cb) {
            c.getRooms(d, cbp);
        }
    };
};