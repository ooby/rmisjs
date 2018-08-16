const createClient = require('../client');
const TimedQueue = require('../../../libs/tqueue');
const wrap = require('../../../libs/wrap');

const q = new TimedQueue(require('../limit'));

module.exports = async s => {
    let c = await q.push(() => createClient(s));
    return {
        describe: () => c.describe(),
        PoiskERZ_FIO: d => wrap(q, () => c.PoiskERZ_FIOAsync(d))
    };
};
