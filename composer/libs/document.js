const rmisjs = require('../../index');

const cache = new Map();

const unformattedSnilsPattern = /^\d{11}$/;
const formattedSnilsPattern = /^\d{3}-\d{3}-\d{3}\s\d{2}$/;
const parseSnils = doc => {
    if (!doc) return null;
    if (!doc.type || !doc.number) return null;
    if (parseInt(doc.type) !== 19) throw new Error('Not a SNILS');
    let snils = doc.number.trim();
    if (formattedSnilsPattern.test(snils)) return snils;
    if (!unformattedSnilsPattern.test(snils)) throw new Error('Wrong SNILS');
    return (
        snils.slice(0, 3) + '-' +
        snils.slice(3, 6) + '-' +
        snils.slice(6, 9) + ' ' +
        snils.slice(9, 11)
    );
};

const searchDocument = async(ind, uid, type) => {
    uid = [].concat(uid).pop();
    if (!uid) return null;
    let key = `${uid}-${type}`;
    if (cache.has(key)) return cache.get(uid);
    let docs = await ind.getIndividualDocuments(uid);
    if (!docs) return null;
    docs = docs.document;
    if (!docs) return null;
    if (docs.length === 0) return null;
    return await new Promise((resolve, reject) => {
        let resolved = false;
        let res = data => {
            if (resolved) return;
            resolved = true;
            resolve(data);
        };
        Promise.all(
            [].concat(docs).map(i =>
                ind.getDocument(i).then(doc => {
                    if (!doc) return;
                    if (doc.type !== type) return;
                    cache.set(key, doc);
                    res(doc);
                })
            )
        ).then(() => res(null));
    });
};

module.exports = async s => {
    const individual = await rmisjs(s).rmis.individual();
    return {
        /**
         * Поиск документа по его типу и UID владельца.
         * @param {string} uid
         * @param {string} type
         * @return {Promise<Object>}
         */
        searchDocument: (uid, type) =>
            searchDocument(individual, uid, type),

        /**
         * Поиск СНИЛС по UID владельца.
         * @param {string} uid
         * @return {Promise<string>}
         */
        getSnils: uid =>
            searchDocument(individual, uid, '19')
            .then(doc => parseSnils(doc)),

        /**
         * Принудительно очистить кэш документов
         * @return {void}
         */
        clearCache: () => cache.clear()
    };
};
