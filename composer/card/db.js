const connect = require('../mongo/connect');
const Card = require('../mongo/model/card');

/**
 * Модуль контроля данных карт
 * @param {Object} s - конфигурация
 * @return {Object}
 */
module.exports = s => {
    /**
     * Поиск карточек по заданному критерию.
     * @param {Object} data критерии поиска
     * @param {Number} data.self стеллаж
     * @param {Number} data.num порядковый номер
     * @param {String} data.surname фамилия пациента (чувств. к регистру)
     * @param {String} data.firstName имя пациента (чувств. к регистру)
     * @param {String} data.patrName отчество пациента (чувств. к регистру)
     * @param {Date} data.birth дата рождения пациента
     * @return {Promise<Object>}
     */
    const get = data =>
        connect(s, () =>
            Card.find(data || {}, {
                _id: false,
                __v: false
            })
            .lean()
            .exec()
        );

    const add = (...data) =>
        connect(s, () =>
            Promise.all(
                data.map(i =>
                    Card.updateOne({
                        shelf: i.shelf,
                        num: i.num
                    }, {
                        $set: i
                    }, {
                        upsert: true
                    }).exec()
                )
            )
        );

    const del = (...data) =>
        connect(s, () =>
            Promise.all(
                data.map(i =>
                    Card.remove({
                        shelf: i.shelf,
                        num: i.num
                    }).exec()
                )
            )
        );

    const composeMethod = async fn => {
        try {
            return await fn();
        } catch (e) {
            console.error(e);
        }
    };

    return {
        get: data =>
            composeMethod(() => get(data)),
        add: (...data) =>
            composeMethod(() => add(...data)),
        del: (...data) =>
            composeMethod(() => del(...data)),
    };
};
