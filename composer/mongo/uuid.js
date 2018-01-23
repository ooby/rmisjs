const mongoose = require('mongoose');
const uuid = require('uuid/v4');

function setUUID(v) {
    if (typeof v === 'string') {
        v = Buffer.from(v.replace(/-/g, ''), 'hex');
    }
    if (v instanceof Buffer) {
        v = new mongoose.Types.Buffer(v).toObject(0x04);
    }
    return v;
};

function getUUID(v) {
    if (typeof v === 'string') return v;
    if (v instanceof Buffer) {
        return uuid({
            random: v
        });
    }
};

function generateUUID() {
    return setUUID(uuid(null, new Buffer(16), 0));
};

function binaryToUUID(binary) {
    return uuid({
        random: binary.buffer
    });
};

module.exports = {
    setUUID,
    getUUID,
    generateUUID,
    binaryToUUID
};
