const createClient = require('../client')
const wrap = require('../../libs/wrap')

module.exports = async (s, q) => {
  let c = await q.push(() => createClient(s, 'resource'))
  return {
    describe: () => c.describe(),
    getLocation: d => wrap(q, () => c.getLocationAsync(d)),
    getLocations: d => wrap(q, () => c.getLocationsAsync(d))
  }
}
