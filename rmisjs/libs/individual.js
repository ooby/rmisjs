module.exports = c => {
    return {
        describe: () => c.describe(),
        getDocument: d => {
            return new Promise((resolve, reject) => {
                c.getDocument(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getIndividual: d => {
            return new Promise((resolve, reject) => {
                c.getIndividual(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        },
        getIndividualDocuments: d => {
            return new Promise((resolve, reject) => {
                c.getIndividualDocuments(d, (e, r) => {
                    if (e) { reject(e); }
                    else { resolve(r); }
                });
            });
        }
    };
};