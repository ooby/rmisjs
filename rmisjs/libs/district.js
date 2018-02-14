const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'district');
    return {
        describe: () => c.describe(),
        getDistrict: d => q.push(() => c.getDistrictAsync(d)),
        getSeparation: d => q.push(() => c.getSeparationAsync(d)),
        searchDistricts: d => q.push(() => c.searchDistrictsAsync(d))
    };
};
