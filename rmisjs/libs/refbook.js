const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'refbook');
    return {
        describe: () => c.describe(),
        getRefbook: d => wrap(q, () => c.getRefbookAsync(d)),
        getRefbookParts: d => wrap(q, () => c.getRefbookPartsAsync(d)),
        getRefbookPartial: d => wrap(q, () => c.getRefbookPartialAsync(d)),
        getRefbookList: d => wrap(q, () => c.getRefbookListAsync(d)),
        getVersionList: d => wrap(q, () => c.getVersionListAsync(d)),
        getRefbookRowData: d => wrap(q, () => c.getRefbookRowDataAsync(d))
    };
};
