const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'appointment');
    return {
        describe: () => c.describe(),
        getTimes: d => wrap(q, () => c.getTimesAsync(d)),
        postReserve: d => wrap(q, () => c.postReserveAsync(d)),
        deleteSlot: d => wrap(q, () => c.deleteSlotAsync(d)),
        getSlot: d => wrap(q, () => c.getSlotAsync(d)),
        getReserve: d => wrap(q, () => c.getReserveAsync(d)),
        getReserveFiltered: d => wrap(q, () => c.getReserveFilteredAsync(d))
    };
};
