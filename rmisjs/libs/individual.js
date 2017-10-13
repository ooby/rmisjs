module.exports = c => {
    return {
        describe: () => c.describe(),
        getDocument: d => new Promise((resolve, reject) => {
            c.getDocument(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getIndividual: d => new Promise((resolve, reject) => {
            c.getIndividual(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        searchIndividual: d => new Promise((resolve, reject) => {
            c.searchIndividual(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        }),
        getIndividualDocuments: d => new Promise((resolve, reject) => {
            c.getIndividualDocuments(d, (e, r) => {
                if (e) { reject(e); }
                else { resolve(r); }
            });
        })
    };
};
