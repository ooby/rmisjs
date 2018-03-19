const rmisjs = require('../../index');

const cache = new Map();

module.exports = async s => {
    const individual = await rmisjs(s).rmis.individual();

    const searchDocuments = async (uid, type, pattern) => {
        uid = [].concat(uid).pop();
        if (!uid) return null;
        let key = `${uid}-${type}`;
        if (cache.has(key)) return cache.get(uid);
        let docs = await individual.getIndividualDocuments(uid);
        if (!docs) return null;
        if (!docs.document) return null;
        docs = [].concat(docs.document);
        if (docs.length === 0) return null;
        for (let doc of docs) {
            doc = await individual.getDocument(doc);
            if (!doc) continue;
            if (doc.type === type && pattern.test(doc.number)) return doc;
        }
        return null;
    };

    return {
        /**
         * Поиск СНИЛС по UID владельца.
         * @param {string} uid
         * @return {Promise<Object | null>}
         */
        searchSnils: uid =>
            searchDocuments(uid, '19', /^(\d{11}|\d{3}-\d{3}-\d{3}\s\d{2})$/)
                .catch(console.error),

        /**
         * Поиск полиса ОМС по UID владельца
         * @param {string} uid
         * @return {Promise<Object>}
         */
        searchPolis: uid =>
            searchDocuments(uid, '26', /^\d{16}$/)
                .catch(console.error),

        /**
         * Принудительно очистить кэш документов
         * @return {void}
         */
        clearCache: () => cache.clear()
    };
};
