const soap = require('soap');

const url = 'https://14.is-mis.ru/ei/services/appointment?wsdl';

const createClient = async s => {
    const c = await soap.createClientAsync(url);
    c.setSecurity(
        new soap.BasicAuthSecurity(s.rmis.auth.username, s.rmis.auth.password)
    );
    return c;
};

module.exports = async s => {
    const c = await createClient(s);

    return {
        /**
         * Получение номера талона по номеру слота
         * @param {*} id - номер слота
         * @return {Promise<String>} - номер талона
         */
        async getAppointmentNumber(id) {
            try {
                let [
                    {
                        number: { number }
                    }
                ] = await c.getAppointmentNumberAsync({ id });
                return number || null;
            } catch (e) {
                console.error(e);
                return e;
            }
        }
    };
};
