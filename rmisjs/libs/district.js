const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'district');
    return {
        describe: () => c.describe(),
        getDistrict: d => wrap(q, () => c.getDistrictAsync(d)),
        getSeparation: d => wrap(q, () => c.getSeparationAsync(d)),
        searchDistricts: d => wrap(q, () => c.searchDistrictsAsync(d)),
    };
};
