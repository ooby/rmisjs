const createClient = require('../client');
const Queue = require('../../libs/queue');
const wrap = require('../../libs/wrap');

const q = new Queue(require('../limit'));

module.exports = async s => {
    let c = await createClient(s, 'individual');
    return {
        describe: () => c.describe(),
        getDocument: d => wrap(q, () => c.getDocumentAsync(d)),
        createDocument: d => wrap(q, () => c.createDocumentAsync(d)),
        editDocument: d => wrap(q, () => c.editDocumentAsync(d)),
        getIndividual: d => wrap(q, () => c.getIndividualAsync(d)),
        searchIndividual: d => wrap(q, () => c.searchIndividualAsync(d)),
        getIndividualDocuments: d => wrap(q, () => c.getIndividualDocumentsAsync(d))
    };
};
