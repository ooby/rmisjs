const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s, 'refbook');
    return {
        describe: () => c.describe(),
        getRefbook: d => q.push(() => c.getRefbookAsync(d)),
        getRefbookList: d => q.push(() => c.getRefbookListAsync(d)),
        getVersionList: d => q.push(() => c.getVersionListAsync(d)),
        getRefbookRowData: d => q.push(() => c.getRefbookRowDataAsync(d))
    };
};
