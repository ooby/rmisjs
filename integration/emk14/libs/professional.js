const createClient = require('../client');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'professional'));

    return {
        /**
         * Поиск медработника
         * @param {String} d - СНИЛС медработника
         * @return {Promise<Object>} - сведения о медработнике
         */
        search: d =>
            q.push(() =>
                c.get('search', {
                    query: d
                })
            ),

        /**
         * Добавление/обновление медработника
         * @param {Object} d - сведения о медработнике
         * @return {Promise<Object>} - код ошибки
         */
        publish: d => q.push(() => c.post('publish', d))
    };
};
