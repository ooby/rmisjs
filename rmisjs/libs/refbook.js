const createClient = require('../client')
const wrap = require('../../libs/wrap')

module.exports = async (s, q) => {
  let c = await q.push(() => createClient(s, 'refbook'))
  return {
    describe: () => c.describe(),
    getRefbook: d => wrap(q, () => c.getRefbookAsync(d)),
    getRefbookParts: d => wrap(q, () => c.getRefbookPartsAsync(d)),
    getRefbookPartial: d => wrap(q, () => c.getRefbookPartialAsync(d)),
    getRefbookList: d => wrap(q, () => c.getRefbookListAsync(d)),
    getVersionList: d => wrap(q, () => c.getVersionListAsync(d)),
    getRefbookRowData: d => wrap(q, () => c.getRefbookRowDataAsync(d))
  }
}
