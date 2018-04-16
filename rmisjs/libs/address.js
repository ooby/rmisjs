const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'address');
    return {
        describe: () => c.describe(),
        createAddress: d => wrap(q, () => c.createAddressAsync(d)),
        getAddresses: d => wrap(q, () => c.getAddressesAsync(d)),
        getAddressInfo: d => wrap(q, () => c.getAddressInfoAsync(d)),
        getAddressAllInfo: d => wrap(q, () => c.getAddressAllInfoAsync(d)),
        getAddressLevelInfo: d => wrap(q, () => c.getAddressLevelInfoAsync(d)),
        getAddressDisplayName: d => wrap(q, () => c.getAddressDisplayNameAsync(d)),
        getAddressType: d => wrap(q, () => c.getAddressTypeAsync(d)),
        getBatchAddressInfo: d => wrap(q, () => c.getBatchAddressInfoAsync(d)),
        searchAddress: d => wrap(q, () => c.searchAddressAsync(d)),
        getVersion: d => wrap(q, () => c.getVersionAsync(d))
    };
};
