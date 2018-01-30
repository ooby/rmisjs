const soap = require('soap');

const opts = {
    endpoint: 'http://10.80.18.60:9765/services/PoiskERZ?wsdl'
};

module.exports = s => new Promise((resolve, reject) => {
    soap.createClient(s.oms.path, opts, (e, c) => {
        if (e) reject(e);
        resolve(c);
    });
});
