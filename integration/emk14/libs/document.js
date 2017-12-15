module.exports = c => {
    return {
        /**
         * Поиск медицинского документа
         * @param {Object} d - параметры поиска
         * @param {String} [d.DocumentGuid] - Идентификатор документа, полученный при регистрации документа
         * @param {String} [d.DocumentMcod] - Код медицинской организации, к которой относится медицинский документ (код ЛПУ в системе ФОМС)
         * @param {String} [d.DocumentDate] - Дата создания документа в МИС
         * @param {String} [d.PatientSnils] - СНИЛС пациента
         * @param {String} [d.ProfessionalSnils] - СНИЛС медработника
         * @return {Promise<Object>} - сведения о документе
         */
        search(d) {
            return c.get('search', {
                query: JSON.stringify({
                    FilterObject: Object.entries(d).map(i => {
                        return {
                            Property: i[0],
                            Value: i[1]
                        };
                    })
                })
            });
        },

        /**
         * Добавление/обновление медицинского документа
         * @param {Object} d - сведения о документе
         * @return {Promise<Object>} - код ошибки
         */
        publish(d) {
            return c.post('publish', d);
        },

        /**
         * Удаление докмента
         * @param {*} d - идентификатор документа
         * @return {Promise<Object>} - код ошибки
         */
        delete(d) {
            return c.get('delete', {
                query: d
            });
        },

        /**
         * Добавление/обновление списка медицинских документов
         * @param {Array<Object>} d - список документов
         * @return {Promise<Object>} - код ошибки
         */
        publishList(d) {
            return c.post('publishList', {
                DocumentList: d
            });
        }
    };
};
