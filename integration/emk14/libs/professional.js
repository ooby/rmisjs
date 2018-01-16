const createClient = require('../client');
const Queue = require('../../../libs/queue');

const q = new Queue(1);

module.exports = s => {
    let c = createClient(s, 'professional');

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
        publish: d =>
            q.push(() =>
                c.post('publish', d)
            )
    };
};
