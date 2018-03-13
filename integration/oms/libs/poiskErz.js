const createClient = require('../client');
const TimedQueue = require('../../../libs/tqueue');

const tq = new TimedQueue(5000);

module.exports = async s => {
    let c = await createClient(s);
    return {
        describe: () => c.describe(),
        PoiskERZ_FIO: d => tq.push(() => c.PoiskERZ_FIOAsync(d))
    };
};
