const soap = require('soap')
const Queue = require('../libs/queue')
const _ = require('lodash')

let q = null

module.exports = s => {
  if (!q) q = new Queue(s, 'nsi.limit', 50)
  return async () => {
    const client = await q.push(() =>
      soap.createClientAsync(s.er14.refbooks, {})
    )
    return {
      getRefbookList: d =>
        q.push(() => client.getRefBookListAsync(d)).then(d => d.shift()),
      getRefbookPartial: d =>
        q.push(() => client.getRefBookPartialAsync(d)).then(d => d.shift()),
      getRefbookParts: d =>
        q.push(() => client.getRefBookPartsAsync(d).then(d => d.shift()))
    }
  }
}
