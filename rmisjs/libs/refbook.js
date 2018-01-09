const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'refbook');
    return {
        describe: () => c.describe(),
        getRefbook: d => c.getRefbookAsync(d),
        getRefbookList: d => c.getRefbookListAsync(d),
        getVersionList: d => c.getVersionListAsync(d),
        getRefbookRowData: d => c.getRefbookRowDataAsync(d)
    };
};
