const request = require('request');

const handleError = (resolve, reject) =>
    (err, res, body) => {
        if (err) return reject(err);
        body = JSON.parse(body);
        if ('ErrorCode' in body) {
            if (parseInt(body.ErrorCode) !== 0) {
                throw new Error(body.ErrorText);
            }
        }
        resolve(body);
    };

const handleRequest = (client, options) =>
    new Promise((resolve, reject) =>
        client(options, handleError(resolve, reject))
    );

exports.createClient = (host, service) => {
    let client = request.defaults({
        baseUrl: `${host}/${service}`
    });
    return {
        get(action, data) {
            return handleRequest(client, {
                method: 'GET',
                url: action,
                qs: data
            });
        },
        post(action, data) {
            return handleRequest(client, {
                method: 'POST',
                url: action,
                json: data
            });
        }
    };
};
