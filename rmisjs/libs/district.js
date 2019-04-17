const createClient = require('../client');
const wrap = require('../../libs/wrap');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'district'));
    return {
        describe: () => c.describe(),
        getDistrict: d => wrap(q, () => c.getDistrictAsync(d)),
        getSeparation: d => wrap(q, () => c.getSeparationAsync(d)),
        searchDistricts: d => wrap(q, () => c.searchDistrictsAsync(d))
    };
};
