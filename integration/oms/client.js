const soap = require('soap');

module.exports = s => new Promise((resolve, reject) => {
    const opts = {
        endpoint: s.oms.path
    };
    soap.createClient(s.oms.path, opts, (e, c) => {
        if (e) reject(e);
        resolve(c);
    });
});
