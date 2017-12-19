const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'district');
    return {
        describe: () => c.describe(),
        getDistrict: d => c.getDistrictAsync(d),
        getSeparation: d => c.getSeparationAsync(d),
        searchDistricts: d => c.searchDistrictsAsync(d)
    };
};
