const createClient = require('../client')
const TimedQueue = require('../../../libs/tqueue')
const wrap = require('../../../libs/wrap')

let q = (module.exports = async s => {
  if (!q) q = new TimedQueue(s.oms.limit)
  let c = await q.push(() => createClient(s))
  return {
    describe: () => c.describe(),
    PoiskERZ_FIO: d => wrap(q, () => c.PoiskERZ_FIOAsync(d))
  }
})
