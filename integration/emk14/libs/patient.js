const createClient = require('../client');

module.exports = async (s, q) => {
    let c = await q.push(() => createClient(s, 'patient'));

    return {
        /**
         * Поиск пациента
         * @param {String} d - СНИЛС пациента
         * @return {Promise<Object>} - сведения о пациенте
         */
        search: d =>
            q.push(() =>
                c.get('search', {
                    query: d
                })
            ),

        /**
         * Добавление пациента
         * @param {Object} d - сведения о пациенте
         * @return {Promise<Object>} - код ошибки
         */
        publish: d =>
            q.push(() =>
                c.post('publish', d)
            )
    };
};
