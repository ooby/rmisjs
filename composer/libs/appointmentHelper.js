const soap = require('soap');

const url = 'https://14.is-mis.ru/ei/services/appointment?wsdl';

module.exports = async(cfg) => {
    const c = await soap.createClientAsync(url);
    c.setSecurity(new soap.BasicAuthSecurity(cfg.rmis.auth.username, cfg.rmis.auth.password));
    return {
        /**
         * Получение номера талона по номеру слота
         * @param {*} id - номер слота
         * @return {Promise<String>} - номер талона
         */
        async getAppointmentNumber(id) {
            let slip = await c.getAppointmentNumberAsync({
                id
            });
            return slip.number.number;
        }
    };
};
