const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'address');
    return {
        describe: () => c.describe(),
        createAddress: d => c.createAddressAsync(d),
        getAddresses: d => c.getAddressesAsync(d),
        getAddressInfo: d => c.getAddressInfoAsync(d),
        getAddressAllInfo: d => c.getAddressAllInfoAsync(d),
        getAddressLevelInfo: d => c.getAddressLevelInfoAsync(d),
        getAddressDisplayName: d => c.getAddressDisplayNameAsync(d),
        getAddressType: d => c.getAddressTypeAsync(d),
        getBatchAddressInfo: d => c.getBatchAddressInfoAsync(d),
        searchAddress: d => c.searchAddressAsync(d),
        getVersion: d => c.getVersionAsync(d)
    };
};
