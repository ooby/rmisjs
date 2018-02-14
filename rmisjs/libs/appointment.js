const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'appointment');
    return {
        describe: () => c.describe(),
        getTimes: d => q.push(() => c.getTimesAsync(d)),
        postReserve: d => q.push(() => c.postReserveAsync(d)),
        deleteSlot: d => q.push(() => c.deleteSlotAsync(d)),
        getSlot: d => q.push(() => c.getSlotAsync(d)),
        getReserve: d => q.push(() => c.getReserveAsync(d)),
        getReserveFiltered: d => q.push(() => c.getReserveFilteredAsync(d))
    };
};
