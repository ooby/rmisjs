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

module.exports = (s, service) => {
    const client = request.defaults({
        baseUrl: `${s.emk14.host}/${service}`
    });
    return {
        get: (action, data) =>
            handleRequest(client, {
                method: 'GET',
                url: action,
                qs: data
            }),

        post: (action, data) =>
            handleRequest(client, {
                method: 'POST',
                url: action,
                json: data
            })
    };
};
