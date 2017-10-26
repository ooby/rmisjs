const soap = require('soap');
const url = 'https://14.is-mis.ru/ei/services/appointment?wsdl';
const createClient = cfg => new Promise((resolve, reject) => {
    soap.createClient(url, opts, (e, c) => {
        if (e) { reject(e); }
        else {
            c.setSecurity(new soap.BasicAuthSecurity(cfg.rmis.auth.username, cfg.rmis.auth.password));
            resolve(c);
        }
    });
});
const getAppointmentNumber = (c, d) => new Promise((resolve, reject) => {
    c.getAppointmentNumber(d, (e, r) => {
        if (e) { reject(e); }
        else { resolve(r); }
    });
});
module.exports = async (config, data) => {
    try {
        let cli = await createClient(config);
        let result = await getAppointmentNumber(cli, data);
        return result;
    } catch (err) { return err; }
};
