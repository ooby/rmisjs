const soap = require('soap');
const { url } = require('../libs/url');
exports.createClient = (cfg, opt) => {
    return new Promise((resolve, reject) => {
        soap.createClient(url(cfg, opt)[0], (e, c) => {
            if (e) { reject(e); }
            else {
                c.setSecurity(new soap.BasicAuthSecurity(cfg.auth.username, cfg.auth.password));
                resolve(c);
            }
        });
    });
};