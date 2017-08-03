const soap = require('soap');
exports.createClient = path => {
    return new Promise((resolve, reject) => {
        soap.createClient(path, (e, c) => {
            if (e) { reject(e); }
            else { resolve(c); }
        });
    });
};
