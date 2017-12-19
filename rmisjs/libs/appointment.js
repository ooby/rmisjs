const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'appointment');
    return {
        describe: () => c.describe(),
        getTimes: d => c.getTimesAsync(d),
        postReserve: d => c.postReserveAsync(d),
        deleteSlot: d => c.deleteSlotAsync(d),
        getSlot: d => c.getSlotAsync(d),
        getReserve: d => c.getReserveAsync(d),
        getReserveFiltered: d => c.getReserveFilteredAsync(d)
    };
};
