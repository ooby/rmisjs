const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(2);

module.exports = async s => {
    let c = await createClient(s, 'address');
    return {
        describe: () => c.describe(),
        createAddress: d => q.push(() => c.createAddressAsync(d)),
        getAddresses: d => q.push(() => c.getAddressesAsync(d)),
        getAddressInfo: d => q.push(() => c.getAddressInfoAsync(d)),
        getAddressAllInfo: d => q.push(() => c.getAddressAllInfoAsync(d)),
        getAddressLevelInfo: d => q.push(() => c.getAddressLevelInfoAsync(d)),
        getAddressDisplayName: d => q.push(() => c.getAddressDisplayNameAsync(d)),
        getAddressType: d => q.push(() => c.getAddressTypeAsync(d)),
        getBatchAddressInfo: d => q.push(() => c.getBatchAddressInfoAsync(d)),
        searchAddress: d => q.push(() => c.searchAddressAsync(d)),
        getVersion: d => q.push(() => c.getVersionAsync(d))
    };
};
