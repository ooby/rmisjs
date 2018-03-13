const soap = require('soap');

module.exports = s =>
    soap.createClientAsync(s.oms.path, {
        endpoint: s.oms.path
    });
