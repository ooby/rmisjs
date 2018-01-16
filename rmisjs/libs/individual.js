const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(1);

module.exports = async s => {
    let c = await createClient(s, 'individual');
    return {
        describe: () => c.describe(),
        getDocument: d => q.push(() => c.getDocumentAsync(d)),
        getIndividual: d => q.push(() => c.getIndividualAsync(d)),
        searchIndividual: d => q.push(() => c.searchIndividualAsync(d)),
        getIndividualDocuments: d => q.push(() => c.getIndividualDocumentsAsync(d))
    };
};
