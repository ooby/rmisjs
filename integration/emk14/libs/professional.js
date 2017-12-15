module.exports = c => {
    return {
        /**
         * Поиск медработника
         * @param {String} d - СНИЛС медработника
         * @return {Promise<Object>} - сведения о медработнике
         */
        search(d) {
            return c.get('search', {
                query: d
            });
        },

        /**
         * Добавление/обновление медработника
         * @param {Object} d - сведения о медработнике
         * @return {Promise<Object>} - код ошибки
         */
        publish(d) {
            return c.post('publish', d);
        }
    };
};
