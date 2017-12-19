const createClient = require('../client');

module.exports = async s => {
    let c = await createClient(s, 'individual');
    return {
        describe: () => c.describe(),
        getDocument: d => c.getDocumentAsync(d),
        getIndividual: d => c.getIndividualAsync(d),
        searchIndividual: d => c.searchIndividualAsync(d),
        getIndividualDocuments: d => c.getIndividualDocumentsAsync(d)
    };
};
