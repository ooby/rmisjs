const createClient = require('../client');

module.exports = s => {
    let c = createClient(s, 'patient');
    
    return {
        /**
         * Поиск пациента
         * @param {String} d - СНИЛС пациента
         * @return {Promise<Object>} - сведения о пациенте
         */
        search(d) {
            return c.get('search', {
                query: d
            });
        },

        /**
         * Добавление пациента
         * @param {Object} d - сведения о пациенте
         * @return {Promise<Object>} - код ошибки
         */
        publish(d) {
            return c.post('publish', d);
        }
    };
};
