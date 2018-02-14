const createClient = require('../client');
const Queue = require('../../libs/queue');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'individual');
    return {
        describe: () => c.describe(),
        getDocument: d => q.push(() => c.getDocumentAsync(d)),
        createDocument: d => q.push(() => c.createDocumentAsync(d)),
        editDocument: d => q.push(() => c.editDocumentAsync(d)),
        getIndividual: d => q.push(() => c.getIndividualAsync(d)),
        searchIndividual: d => q.push(() => c.searchIndividualAsync(d)),
        getIndividualDocuments: d => q.push(() => c.getIndividualDocumentsAsync(d))
    };
};
